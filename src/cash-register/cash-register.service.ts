import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { eq, desc, and, count, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import {
  cashRegisters,
  receiptSeries,
  billingTransactions,
  billingAccounts,
  users,
} from '../database/schema';
import * as schema from '../database/schema';
import {
  OpenCashRegisterDto,
  CloseCashRegisterDto,
  CollectPaymentDto,
  UpdateReceiptSeriesDto,
  CreateReceiptSeriesDto,
} from './dto/cash-register.dto';

@Injectable()
export class CashRegisterService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ── Cash Registers ─────────────────────────────────────────────────────────

  async findAll(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const conditions: any[] = [];
    if (status) conditions.push(eq(cashRegisters.status, status as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: cashRegisters.id,
          name: cashRegisters.name,
          status: cashRegisters.status,
          openingBalance: cashRegisters.openingBalance,
          closingBalance: cashRegisters.closingBalance,
          expectedBalance: cashRegisters.expectedBalance,
          openedAt: cashRegisters.openedAt,
          closedAt: cashRegisters.closedAt,
          notes: cashRegisters.notes,
          assignedUser: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
          },
        })
        .from(cashRegisters)
        .innerJoin(users, eq(cashRegisters.assignedUserId, users.id))
        .where(where)
        .orderBy(desc(cashRegisters.openedAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(cashRegisters).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOne(id: string) {
    const [register] = await this.db
      .select({
        id: cashRegisters.id,
        name: cashRegisters.name,
        status: cashRegisters.status,
        openingBalance: cashRegisters.openingBalance,
        closingBalance: cashRegisters.closingBalance,
        expectedBalance: cashRegisters.expectedBalance,
        openedAt: cashRegisters.openedAt,
        closedAt: cashRegisters.closedAt,
        notes: cashRegisters.notes,
        assignedUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(cashRegisters)
      .innerJoin(users, eq(cashRegisters.assignedUserId, users.id))
      .where(eq(cashRegisters.id, id))
      .limit(1);

    if (!register) throw new NotFoundException('Caja no encontrada');

    // Fetch transactions processed through this cash register
    const transactions = await this.db
      .select()
      .from(billingTransactions)
      .where(eq(billingTransactions.cashRegisterId, id))
      .orderBy(desc(billingTransactions.paidAt));

    return { ...register, transactions };
  }

  async openCashRegister(dto: OpenCashRegisterDto, userId: string) {
    // Check if user already has an open register
    const [existing] = await this.db
      .select({ id: cashRegisters.id })
      .from(cashRegisters)
      .where(
        and(
          eq(cashRegisters.assignedUserId, userId),
          eq(cashRegisters.status, 'open'),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.');
    }

    const [register] = await this.db
      .insert(cashRegisters)
      .values({
        name: dto.name,
        assignedUserId: userId,
        openingBalance: dto.openingBalance ?? '0',
        status: 'open',
        notes: dto.notes,
      })
      .returning();

    return register;
  }

  async closeCashRegister(id: string, dto: CloseCashRegisterDto, userId: string) {
    const [register] = await this.db
      .select()
      .from(cashRegisters)
      .where(eq(cashRegisters.id, id))
      .limit(1);

    if (!register) throw new NotFoundException('Caja no encontrada');
    if (register.status === 'closed') {
      throw new BadRequestException('Esta caja ya está cerrada');
    }
    if (register.assignedUserId !== userId) {
      throw new BadRequestException('Solo el cajero asignado puede cerrar esta caja');
    }

    // Calculate expected balance: opening + all payments received
    const [{ totalCollected }] = await this.db
      .select({
        totalCollected: sql<string>`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)`,
      })
      .from(billingTransactions)
      .where(
        and(
          eq(billingTransactions.cashRegisterId, id),
          eq(billingTransactions.status, 'paid'),
        ),
      );

    const expected =
      parseFloat(register.openingBalance) + parseFloat(totalCollected ?? '0');

    const [closed] = await this.db
      .update(cashRegisters)
      .set({
        status: 'closed',
        closingBalance: dto.closingBalance,
        expectedBalance: expected.toFixed(2),
        closedAt: new Date(),
        notes: dto.notes ?? register.notes,
        updatedAt: new Date(),
      })
      .where(eq(cashRegisters.id, id))
      .returning();

    return closed;
  }

  async getMyOpenRegister(userId: string) {
    const [register] = await this.db
      .select()
      .from(cashRegisters)
      .where(
        and(
          eq(cashRegisters.assignedUserId, userId),
          eq(cashRegisters.status, 'open'),
        ),
      )
      .limit(1);

    return register ?? null;
  }

  async collectPayment(dto: CollectPaymentDto, cashierId: string) {
    // Find open register for this cashier
    const [register] = await this.db
      .select()
      .from(cashRegisters)
      .where(
        and(
          eq(cashRegisters.assignedUserId, cashierId),
          eq(cashRegisters.status, 'open'),
        ),
      )
      .limit(1);

    if (!register) {
      throw new BadRequestException('No tienes una caja abierta. Abre una caja antes de cobrar.');
    }

    const [transaction] = await this.db
      .select()
      .from(billingTransactions)
      .where(eq(billingTransactions.id, dto.transactionId))
      .limit(1);

    if (!transaction) throw new NotFoundException('Transacción no encontrada');
    if (transaction.status !== 'pending') {
      throw new BadRequestException(`La transacción no está pendiente (estado: ${transaction.status})`);
    }

    const amountPaid = parseFloat(dto.amountPaid);
    const amount = parseFloat(transaction.amount);

    if (amountPaid < amount) {
      throw new BadRequestException(
        `Monto insuficiente. Se debe pagar S/ ${amount.toFixed(2)}, se recibió S/ ${amountPaid.toFixed(2)}`,
      );
    }

    const change = amountPaid - amount;

    // Generate receipt number from series
    const receiptNumber = await this.generateReceiptNumber(dto.receiptType as 'boleta' | 'factura');

    const [updated] = await this.db
      .update(billingTransactions)
      .set({
        status: 'paid',
        paymentMethod: dto.paymentMethod as any,
        receiptType: dto.receiptType as any,
        receiptNumber,
        cashRegisterId: register.id,
        amountPaid: dto.amountPaid,
        change: change.toFixed(2),
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(billingTransactions.id, dto.transactionId))
      .returning();

    await this.recalculateBalance(transaction.patientId);

    return {
      transaction: updated,
      receiptNumber,
      amountPaid,
      change: change.toFixed(2),
      cashRegisterName: register.name,
    };
  }

  // ── Receipt Series ─────────────────────────────────────────────────────────

  async findAllSeries() {
    return this.db.select().from(receiptSeries).orderBy(receiptSeries.type, receiptSeries.prefix);
  }

  async createSeries(dto: CreateReceiptSeriesDto) {
    const [series] = await this.db
      .insert(receiptSeries)
      .values({
        type: dto.type as any,
        prefix: dto.prefix,
        currentNumber: dto.currentNumber ?? 0,
      })
      .returning();
    return series;
  }

  async updateSeries(id: string, dto: UpdateReceiptSeriesDto) {
    const [series] = await this.db
      .select()
      .from(receiptSeries)
      .where(eq(receiptSeries.id, id))
      .limit(1);

    if (!series) throw new NotFoundException('Serie no encontrada');

    const [updated] = await this.db
      .update(receiptSeries)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(receiptSeries.id, id))
      .returning();

    return updated;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async generateReceiptNumber(type: 'boleta' | 'factura'): Promise<string> {
    const [series] = await this.db
      .select()
      .from(receiptSeries)
      .where(and(eq(receiptSeries.type, type), eq(receiptSeries.isActive, true)))
      .orderBy(receiptSeries.createdAt)
      .limit(1);

    if (!series) {
      // Fallback when no series is configured
      const year = new Date().getFullYear();
      const prefix = type === 'boleta' ? 'B' : 'F';
      return `${prefix}${year}-${Date.now().toString().slice(-6)}`;
    }

    const nextNumber = series.currentNumber + 1;

    await this.db
      .update(receiptSeries)
      .set({ currentNumber: nextNumber, updatedAt: new Date() })
      .where(eq(receiptSeries.id, series.id));

    return `${series.prefix}-${String(nextNumber).padStart(8, '0')}`;
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
