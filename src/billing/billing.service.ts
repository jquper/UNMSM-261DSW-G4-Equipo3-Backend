import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { billingAccounts, billingTransactions, patients } from '../database/schema';
import * as schema from '../database/schema';
import { CreateTransactionDto, PayTransactionDto, PayAllDto } from './dto/billing.dto';

@Injectable()
export class BillingService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getAccount(patientId: string) {
    const [account] = await this.db
      .select()
      .from(billingAccounts)
      .where(eq(billingAccounts.patientId, patientId))
      .limit(1);

    if (!account) throw new NotFoundException('Cuenta de facturación no encontrada');
    return account;
  }

  async getTransactions(patientId: string, page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const conditions = [eq(billingTransactions.patientId, patientId)];
    if (status) conditions.push(eq(billingTransactions.status, status as any));

    const where = and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(billingTransactions)
        .where(where)
        .orderBy(desc(billingTransactions.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(billingTransactions).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async createTransaction(dto: CreateTransactionDto, createdBy: string) {
    const [account] = await this.db
      .select({ id: billingAccounts.id })
      .from(billingAccounts)
      .where(eq(billingAccounts.patientId, dto.patientId))
      .limit(1);

    if (!account) throw new NotFoundException('Cuenta de paciente no encontrada');

    const [transaction] = await this.db
      .insert(billingTransactions)
      .values({
        accountId: account.id,
        patientId: dto.patientId,
        type: dto.type as any,
        amount: dto.amount,
        description: dto.description,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        status: 'pending',
        createdBy,
      })
      .returning();

    await this.recalculateBalance(dto.patientId);
    return transaction;
  }

  async payTransaction(id: string, dto: PayTransactionDto) {
    const [transaction] = await this.db
      .select()
      .from(billingTransactions)
      .where(eq(billingTransactions.id, id))
      .limit(1);

    if (!transaction) throw new NotFoundException('Transacción no encontrada');

    const [updated] = await this.db
      .update(billingTransactions)
      .set({ status: 'paid', paidAt: new Date(), receiptNumber: dto.receiptNumber, updatedAt: new Date() })
      .where(eq(billingTransactions.id, id))
      .returning();

    await this.recalculateBalance(transaction.patientId);
    return updated;
  }

  async payAll(patientId: string, dto: PayAllDto) {
    const pending = await this.db
      .select()
      .from(billingTransactions)
      .where(
        and(
          eq(billingTransactions.patientId, patientId),
          eq(billingTransactions.status, 'pending'),
        ),
      );

    if (pending.length === 0) {
      throw new BadRequestException('No hay transacciones pendientes para este paciente');
    }

    const year = new Date().getFullYear();
    const receiptNumber = dto.receiptNumber || `REC-${year}-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    await this.db
      .update(billingTransactions)
      .set({ status: 'paid', paidAt: now, receiptNumber, updatedAt: now })
      .where(
        and(
          eq(billingTransactions.patientId, patientId),
          eq(billingTransactions.status, 'pending'),
        ),
      );

    await this.recalculateBalance(patientId);
    return this.getReceipt(receiptNumber);
  }

  async getReceipt(receiptNumber: string) {
    const rows = await this.db
      .select({
        transaction: billingTransactions,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          documentNumber: patients.documentNumber,
          phone: patients.phone,
        },
      })
      .from(billingTransactions)
      .innerJoin(patients, eq(billingTransactions.patientId, patients.id))
      .where(eq(billingTransactions.receiptNumber, receiptNumber));

    if (rows.length === 0) throw new NotFoundException('Comprobante no encontrado');

    const total = rows.reduce((sum, r) => sum + parseFloat(r.transaction.amount), 0);
    return {
      receiptNumber,
      patient: rows[0].patient,
      items: rows.map((r) => r.transaction),
      total: total.toFixed(2),
      paidAt: rows[0].transaction.paidAt,
    };
  }

  async getDebtors(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.db
      .select({
        account: billingAccounts,
        patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName, documentNumber: patients.documentNumber, phone: patients.phone },
      })
      .from(billingAccounts)
      .innerJoin(patients, eq(billingAccounts.patientId, patients.id))
      .where(sql`CAST(${billingAccounts.balance} AS DECIMAL) > 0`)
      .orderBy(desc(billingAccounts.balance))
      .limit(limit)
      .offset(offset);
  }

  private async recalculateBalance(patientId: string) {
    const [result] = await this.db
      .select({
        totalCharged: sql<string>`COALESCE(SUM(CASE WHEN type = 'charge' AND status != 'cancelled' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
        totalPaid: sql<string>`COALESCE(SUM(CASE WHEN type IN ('payment', 'refund') AND status = 'paid' THEN CAST(amount AS DECIMAL) ELSE 0 END), 0)`,
      })
      .from(billingTransactions)
      .where(eq(billingTransactions.patientId, patientId));

    const charged = parseFloat(result?.totalCharged ?? '0');
    const paid = parseFloat(result?.totalPaid ?? '0');
    const balance = Math.max(0, charged - paid);

    await this.db
      .update(billingAccounts)
      .set({
        balance: String(balance),
        totalCharged: String(charged),
        totalPaid: String(paid),
        updatedAt: new Date(),
      })
      .where(eq(billingAccounts.patientId, patientId));
  }
}
