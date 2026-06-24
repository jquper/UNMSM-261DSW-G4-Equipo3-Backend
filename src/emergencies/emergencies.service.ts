import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, and, count, gte, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import {
  emergencies,
  patients,
  tickets,
  billingAccounts,
  billingTransactions,
} from '../database/schema';
import * as schema from '../database/schema';
import { CreateEmergencyDto, UpdateEmergencyDto } from './dto/emergency.dto';

const TRIAGE_PRIORITY: Record<number, string> = {
  1: 'immediate', 2: 'very_urgent', 3: 'urgent', 4: 'normal', 5: 'non_urgent',
};

// Standard emergency attendance fee
const EMERGENCY_FEE = '80.00';

@Injectable()
export class EmergenciesService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(page = 1, limit = 20, filters?: { status?: string }) {
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];
    if (filters?.status) conditions.push(eq(emergencies.status, filters.status as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: emergencies.id,
          triageLevel: emergencies.triageLevel,
          chiefComplaint: emergencies.chiefComplaint,
          vitalSigns: emergencies.vitalSigns,
          status: emergencies.status,
          bed: emergencies.bed,
          arrivalTime: emergencies.arrivalTime,
          dischargeTime: emergencies.dischargeTime,
          patient: {
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
            birthDate: patients.birthDate,
            bloodType: patients.bloodType,
          },
        })
        .from(emergencies)
        .innerJoin(patients, eq(emergencies.patientId, patients.id))
        .where(where)
        .orderBy(emergencies.triageLevel, desc(emergencies.arrivalTime))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(emergencies).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOne(id: string) {
    const [emergency] = await this.db
      .select()
      .from(emergencies)
      .where(eq(emergencies.id, id))
      .limit(1);

    if (!emergency) throw new NotFoundException('Emergencia no encontrada');
    return emergency;
  }

  async create(dto: CreateEmergencyDto, createdBy: string) {
    let ticketId = dto.ticketId;

    if (!ticketId) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const [{ total }] = await this.db
        .select({ total: count() })
        .from(tickets)
        .where(and(eq(tickets.type, 'emergency'), gte(tickets.createdAt, new Date(new Date().setHours(0, 0, 0, 0)))));
      const seq = String(Number(total) + 1).padStart(3, '0');

      const [ticket] = await this.db
        .insert(tickets)
        .values({
          ticketNumber: `E-${today}-${seq}`,
          patientId: dto.patientId,
          type: 'emergency',
          priority: (TRIAGE_PRIORITY[dto.triageLevel] ?? 'urgent') as any,
          createdBy,
        })
        .returning();

      ticketId = ticket.id;
    }

    const [emergency] = await this.db
      .insert(emergencies)
      .values({
        patientId: dto.patientId,
        ticketId,
        doctorId: dto.doctorId,
        triageLevel: dto.triageLevel,
        chiefComplaint: dto.chiefComplaint,
        vitalSigns: dto.vitalSigns,
        bed: dto.bed,
        status: 'active',
      })
      .returning();

    // Auto-create billing debt for the emergency attendance
    await this.createEmergencyDebt(dto.patientId, emergency.id, createdBy);

    return emergency;
  }

  async update(id: string, dto: UpdateEmergencyDto) {
    await this.findOne(id);

    const updates: any = { ...dto, status: dto.status as any, updatedAt: new Date() };
    if (dto.status === 'discharged' || dto.status === 'transferred' || dto.status === 'deceased') {
      updates.dischargeTime = new Date();
    }

    const [updated] = await this.db
      .update(emergencies)
      .set(updates)
      .where(eq(emergencies.id, id))
      .returning();

    return updated;
  }

  async getActiveCount() {
    const [result] = await this.db
      .select({ total: count() })
      .from(emergencies)
      .where(and(
        eq(emergencies.status, 'active'),
        gte(emergencies.arrivalTime, new Date(new Date().setHours(0, 0, 0, 0))),
      ));
    return { active: Number(result?.total ?? 0) };
  }

  private async createEmergencyDebt(patientId: string, emergencyId: string, createdBy: string) {
    const [account] = await this.db
      .select({ id: billingAccounts.id })
      .from(billingAccounts)
      .where(eq(billingAccounts.patientId, patientId))
      .limit(1);

    if (!account) return; // No billing account — patient may not have one yet

    await this.db.insert(billingTransactions).values({
      accountId: account.id,
      patientId,
      type: 'charge',
      concept: 'emergencia',
      amount: EMERGENCY_FEE,
      description: 'Atención de emergencia',
      referenceType: 'emergency',
      referenceId: emergencyId,
      status: 'pending',
      createdBy,
    });

    // Recalculate balance
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
