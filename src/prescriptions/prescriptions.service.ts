import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, and, count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { prescriptions, prescriptionItems, patients, doctors } from '../database/schema';
import * as schema from '../database/schema';
import { CreatePrescriptionDto, UpdatePrescriptionStatusDto } from './dto/prescription.dto';
import { BillingService } from '../billing/billing.service';
import { TransactionType } from '../billing/dto/billing.dto';

@Injectable()
export class PrescriptionsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
    private readonly billingService: BillingService,
  ) {}

  async findAll(page = 1, limit = 20, patientId?: string) {
    const offset = (page - 1) * limit;
    const conditions = patientId ? [eq(prescriptions.patientId, patientId)] : [];
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: prescriptions.id,
          prescriptionDate: prescriptions.prescriptionDate,
          status: prescriptions.status,
          createdAt: prescriptions.createdAt,
          patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName },
          doctor: { id: doctors.id, cmp: doctors.cmp },
        })
        .from(prescriptions)
        .innerJoin(patients, eq(prescriptions.patientId, patients.id))
        .innerJoin(doctors, eq(prescriptions.doctorId, doctors.id))
        .where(where)
        .orderBy(desc(prescriptions.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(prescriptions).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOne(id: string) {
    const [prescription] = await this.db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, id))
      .limit(1);

    if (!prescription) throw new NotFoundException('Receta no encontrada');

    const items = await this.db
      .select()
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, id));

    return { ...prescription, items };
  }

  async create(dto: CreatePrescriptionDto) {
    const [prescription] = await this.db
      .insert(prescriptions)
      .values({
        medicalRecordId: dto.medicalRecordId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        prescriptionDate: dto.prescriptionDate,
        notes: dto.notes,
        status: 'active',
      })
      .returning();

    await this.db.insert(prescriptionItems).values(
      dto.items.map((item) => ({ ...item, prescriptionId: prescription.id })),
    );

    return this.findOne(prescription.id);
  }

  async updateStatus(id: string, dto: UpdatePrescriptionStatusDto, dispensedBy: string) {
    const prescription = await this.findOne(id);

    const [updated] = await this.db
      .update(prescriptions)
      .set({ status: dto.status as any, updatedAt: new Date() })
      .where(eq(prescriptions.id, id))
      .returning();

    if (dto.status === 'dispensed') {
      const itemCount = prescription.items.length;
      const medications = prescription.items.map((i: any) => i.medication).join(', ');
      await this.billingService.createTransaction(
        {
          patientId: prescription.patientId,
          type: TransactionType.CHARGE,
          amount: dto.totalAmount || '0',
          description: `Medicamentos (${itemCount} ítem${itemCount !== 1 ? 's' : ''}): ${medications}`,
          referenceType: 'prescription',
          referenceId: id,
        },
        dispensedBy,
      );
    }

    return updated;
  }
}
