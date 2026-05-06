import { Injectable, ConflictException, NotFoundException, Inject } from '@nestjs/common';
import { eq, ilike, desc } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { specialties } from '../database/schema';
import * as schema from '../database/schema';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto/specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db.select().from(specialties).where(eq(specialties.isActive, true)).orderBy(specialties.name);
  }

  async findOne(id: string) {
    const [specialty] = await this.db.select().from(specialties).where(eq(specialties.id, id)).limit(1);
    if (!specialty) throw new NotFoundException('Especialidad no encontrada');
    return specialty;
  }

  async create(dto: CreateSpecialtyDto) {
    const [existing] = await this.db
      .select({ id: specialties.id })
      .from(specialties)
      .where(ilike(specialties.name, dto.name))
      .limit(1);

    if (existing) throw new ConflictException('Ya existe una especialidad con ese nombre');

    const [specialty] = await this.db.insert(specialties).values(dto).returning();
    return specialty;
  }

  async update(id: string, dto: UpdateSpecialtyDto) {
    await this.findOne(id);
    const [updated] = await this.db.update(specialties).set(dto).where(eq(specialties.id, id)).returning();
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.db.update(specialties).set({ isActive: false }).where(eq(specialties.id, id));
    return { message: 'Especialidad desactivada' };
  }
}
