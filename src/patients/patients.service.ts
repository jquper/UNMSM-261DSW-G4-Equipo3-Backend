import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { eq, ilike, or, desc, and, count, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { patients, billingAccounts } from '../database/schema';
import * as schema from '../database/schema';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(page = 1, limit = 20, search?: string) {
    const offset = (page - 1) * limit;
    const conditions: (SQL | undefined)[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(patients.firstName, `%${search}%`),
          ilike(patients.lastName, `%${search}%`),
          ilike(patients.documentNumber, `%${search}%`),
          ilike(patients.phone, `%${search}%`),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db.select().from(patients).where(where).orderBy(desc(patients.createdAt)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(patients).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOne(id: string) {
    const [patient] = await this.db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);

    if (!patient) throw new NotFoundException('Paciente no encontrado');
    return patient;
  }

  async findByDocument(documentType: string, documentNumber: string) {
    const [patient] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.documentType, documentType as any), eq(patients.documentNumber, documentNumber)))
      .limit(1);
    return patient || null;
  }

  async create(dto: CreatePatientDto) {
    const existing = await this.findByDocument(dto.documentType, dto.documentNumber);
    if (existing) throw new ConflictException('Ya existe un paciente con ese documento');

    const [patient] = await this.db
      .insert(patients)
      .values({
        ...dto,
        documentType: dto.documentType as any,
        gender: dto.gender as any,
        bloodType: dto.bloodType as any,
      })
      .returning();

    // Create billing account automatically
    await this.db.insert(billingAccounts).values({ patientId: patient.id });

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto) {
    await this.findOne(id);

    const [updated] = await this.db
      .update(patients)
      .set({ ...dto, bloodType: dto.bloodType as any, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();

    return updated;
  }

  async getStats(id: string) {
    await this.findOne(id);

    const [appointmentsCount, emergenciesCount, billingAccount] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(schema.appointments)
        .where(eq(schema.appointments.patientId, id)),
      this.db
        .select({ total: count() })
        .from(schema.emergencies)
        .where(eq(schema.emergencies.patientId, id)),
      this.db
        .select()
        .from(billingAccounts)
        .where(eq(billingAccounts.patientId, id))
        .limit(1),
    ]);

    return {
      appointments: Number(appointmentsCount[0]?.total ?? 0),
      emergencies: Number(emergenciesCount[0]?.total ?? 0),
      balance: billingAccount[0]?.balance ?? '0',
    };
  }
}
