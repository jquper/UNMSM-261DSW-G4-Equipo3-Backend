import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { eq, desc, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { doctors, users, specialties } from '../database/schema';
import * as schema from '../database/schema';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(specialtyId?: string) {
    const conditions = [eq(doctors.isActive, true)];
    if (specialtyId) conditions.push(eq(doctors.specialtyId, specialtyId));

    return this.db
      .select({
        id: doctors.id,
        cmp: doctors.cmp,
        consultationFee: doctors.consultationFee,
        schedule: doctors.schedule,
        isActive: doctors.isActive,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        specialty: {
          id: specialties.id,
          name: specialties.name,
          color: specialties.color,
        },
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .innerJoin(specialties, eq(doctors.specialtyId, specialties.id))
      .where(and(...conditions))
      .orderBy(users.lastName);
  }

  async findOne(id: string) {
    const [doctor] = await this.db
      .select({
        id: doctors.id,
        cmp: doctors.cmp,
        consultationFee: doctors.consultationFee,
        schedule: doctors.schedule,
        isActive: doctors.isActive,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
        specialty: {
          id: specialties.id,
          name: specialties.name,
        },
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.userId, users.id))
      .innerJoin(specialties, eq(doctors.specialtyId, specialties.id))
      .where(eq(doctors.id, id))
      .limit(1);

    if (!doctor) throw new NotFoundException('Médico no encontrado');
    return doctor;
  }

  async findByUserId(userId: string) {
    const [doctor] = await this.db
      .select()
      .from(doctors)
      .where(eq(doctors.userId, userId))
      .limit(1);
    return doctor || null;
  }

  async create(dto: CreateDoctorDto) {
    const [existingCmp] = await this.db
      .select({ id: doctors.id })
      .from(doctors)
      .where(eq(doctors.cmp, dto.cmp))
      .limit(1);

    if (existingCmp) throw new ConflictException('Ya existe un médico con ese CMP');

    const [doctor] = await this.db
      .insert(doctors)
      .values({
        userId: dto.userId,
        specialtyId: dto.specialtyId,
        cmp: dto.cmp,
        consultationFee: dto.consultationFee || '0',
        schedule: dto.schedule,
      })
      .returning();

    return doctor;
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findOne(id);
    const [updated] = await this.db
      .update(doctors)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(doctors.id, id))
      .returning();
    return updated;
  }
}
