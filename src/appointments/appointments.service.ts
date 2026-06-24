import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { eq, desc, and, count, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { appointments, patients, doctors, specialties, billingAccounts } from '../database/schema';
import * as schema from '../database/schema';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';
import { BillingService } from '../billing/billing.service';
import { TransactionType } from '../billing/dto/billing.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
    private readonly billingService: BillingService,
  ) {}

  async findAll(page = 1, limit = 20, filters?: { doctorId?: string; patientId?: string; date?: string; status?: string }) {
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters?.doctorId) conditions.push(eq(appointments.doctorId, filters.doctorId));
    if (filters?.patientId) conditions.push(eq(appointments.patientId, filters.patientId));
    if (filters?.status) conditions.push(eq(appointments.status, filters.status as any));
    if (filters?.date) conditions.push(eq(appointments.appointmentDate, filters.date));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: appointments.id,
          appointmentDate: appointments.appointmentDate,
          appointmentTime: appointments.appointmentTime,
          durationMinutes: appointments.durationMinutes,
          status: appointments.status,
          reason: appointments.reason,
          fee: appointments.fee,
          createdAt: appointments.createdAt,
          patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName, documentNumber: patients.documentNumber },
          doctor: { id: doctors.id, cmp: doctors.cmp },
          specialty: { id: specialties.id, name: specialties.name, color: specialties.color },
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(doctors, eq(appointments.doctorId, doctors.id))
        .innerJoin(specialties, eq(appointments.specialtyId, specialties.id))
        .where(where)
        .orderBy(desc(appointments.appointmentDate), desc(appointments.appointmentTime))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(appointments).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOne(id: string) {
    const [appointment] = await this.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id))
      .limit(1);

    if (!appointment) throw new NotFoundException('Cita no encontrada');
    return appointment;
  }

  async create(dto: CreateAppointmentDto, createdBy: string) {
    const [conflict] = await this.db
      .select({ id: appointments.id })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctorId, dto.doctorId),
          eq(appointments.appointmentDate, dto.appointmentDate),
          eq(appointments.appointmentTime, dto.appointmentTime),
          eq(appointments.status, 'scheduled'),
        ),
      )
      .limit(1);

    if (conflict) throw new ConflictException('El médico ya tiene una cita en ese horario');

    // Auto-create billing account if the patient doesn't have one yet
    await this.db
      .insert(billingAccounts)
      .values({ patientId: dto.patientId })
      .onConflictDoNothing();

    const [appointment] = await this.db
      .insert(appointments)
      .values({ ...dto, status: 'scheduled', createdBy })
      .returning();

    await this.billingService.createTransaction(
      {
        patientId: dto.patientId,
        type: TransactionType.CHARGE,
        amount: dto.fee || '0',
        description: `Consulta médica - Cita ${appointment.id.substring(0, 8)}`,
        referenceType: 'appointment',
        referenceId: appointment.id,
      },
      createdBy,
    );

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto) {
    await this.findOne(id);
    const [updated] = await this.db
      .update(appointments)
      .set({ ...dto, status: dto.status as any, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return updated;
  }

  async getDoctorSchedule(doctorId: string, date: string) {
    return this.db
      .select({
        id: appointments.id,
        appointmentTime: appointments.appointmentTime,
        durationMinutes: appointments.durationMinutes,
        status: appointments.status,
        patient: { firstName: patients.firstName, lastName: patients.lastName },
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(and(eq(appointments.doctorId, doctorId), eq(appointments.appointmentDate, date)))
      .orderBy(appointments.appointmentTime);
  }
}
