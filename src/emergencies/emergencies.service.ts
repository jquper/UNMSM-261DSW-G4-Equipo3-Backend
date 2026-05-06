import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, and, count, gte, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { emergencies, patients, doctors, users } from '../database/schema';
import * as schema from '../database/schema';
import { CreateEmergencyDto, UpdateEmergencyDto } from './dto/emergency.dto';

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
          patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName, birthDate: patients.birthDate, bloodType: patients.bloodType },
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

  async create(dto: CreateEmergencyDto) {
    const [emergency] = await this.db
      .insert(emergencies)
      .values({
        patientId: dto.patientId,
        ticketId: dto.ticketId,
        doctorId: dto.doctorId,
        triageLevel: dto.triageLevel,
        chiefComplaint: dto.chiefComplaint,
        vitalSigns: dto.vitalSigns,
        bed: dto.bed,
        status: 'active',
      })
      .returning();

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
}
