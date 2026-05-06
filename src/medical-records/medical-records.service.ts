import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, and, count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { medicalRecords, patients, doctors, users } from '../database/schema';
import * as schema from '../database/schema';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from './dto/medical-record.dto';

@Injectable()
export class MedicalRecordsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(page = 1, limit = 20, patientId?: string) {
    const offset = (page - 1) * limit;
    const conditions = patientId ? [eq(medicalRecords.patientId, patientId)] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: medicalRecords.id,
          diagnosis: medicalRecords.diagnosis,
          diagnosisCie10: medicalRecords.diagnosisCie10,
          followUpDate: medicalRecords.followUpDate,
          createdAt: medicalRecords.createdAt,
          patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName },
          doctor: { id: doctors.id, cmp: doctors.cmp },
        })
        .from(medicalRecords)
        .innerJoin(patients, eq(medicalRecords.patientId, patients.id))
        .innerJoin(doctors, eq(medicalRecords.doctorId, doctors.id))
        .where(where)
        .orderBy(desc(medicalRecords.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(medicalRecords).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOne(id: string) {
    const [record] = await this.db
      .select()
      .from(medicalRecords)
      .where(eq(medicalRecords.id, id))
      .limit(1);

    if (!record) throw new NotFoundException('Historia clínica no encontrada');
    return record;
  }

  async findByPatient(patientId: string) {
    return this.db
      .select({
        id: medicalRecords.id,
        diagnosis: medicalRecords.diagnosis,
        diagnosisCie10: medicalRecords.diagnosisCie10,
        treatment: medicalRecords.treatment,
        indications: medicalRecords.indications,
        followUpDate: medicalRecords.followUpDate,
        createdAt: medicalRecords.createdAt,
        doctor: { id: doctors.id, cmp: doctors.cmp },
      })
      .from(medicalRecords)
      .innerJoin(doctors, eq(medicalRecords.doctorId, doctors.id))
      .where(eq(medicalRecords.patientId, patientId))
      .orderBy(desc(medicalRecords.createdAt));
  }

  async create(dto: CreateMedicalRecordDto) {
    const [record] = await this.db
      .insert(medicalRecords)
      .values(dto)
      .returning();
    return record;
  }

  async update(id: string, dto: UpdateMedicalRecordDto) {
    await this.findOne(id);
    const [updated] = await this.db
      .update(medicalRecords)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(medicalRecords.id, id))
      .returning();
    return updated;
  }
}
