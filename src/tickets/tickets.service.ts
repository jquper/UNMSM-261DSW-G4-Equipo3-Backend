import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, desc, and, gte, lte, count, sql, type SQL } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import { tickets, patients, users } from '../database/schema';
import * as schema from '../database/schema';
import { CreateTicketDto, UpdateTicketStatusDto } from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(page = 1, limit = 50, filters?: { status?: string; type?: string; date?: string }) {
    const offset = (page - 1) * limit;
    const conditions: SQL[] = [];

    if (filters?.status) conditions.push(eq(tickets.status, filters.status as any));
    if (filters?.type) conditions.push(eq(tickets.type, filters.type as any));
    if (filters?.date) {
      const start = new Date(filters.date);
      const end = new Date(filters.date);
      end.setDate(end.getDate() + 1);
      conditions.push(gte(tickets.createdAt, start));
      conditions.push(lte(tickets.createdAt, end));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: tickets.id,
          ticketNumber: tickets.ticketNumber,
          type: tickets.type,
          priority: tickets.priority,
          status: tickets.status,
          triageNotes: tickets.triageNotes,
          module: tickets.module,
          createdAt: tickets.createdAt,
          calledAt: tickets.calledAt,
          attendedAt: tickets.attendedAt,
          finishedAt: tickets.finishedAt,
          patient: {
            id: patients.id,
            firstName: patients.firstName,
            lastName: patients.lastName,
            documentNumber: patients.documentNumber,
          },
        })
        .from(tickets)
        .innerJoin(patients, eq(tickets.patientId, patients.id))
        .where(where)
        .orderBy(desc(tickets.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(tickets).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOne(id: string) {
    const [ticket] = await this.db
      .select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        type: tickets.type,
        priority: tickets.priority,
        status: tickets.status,
        triageNotes: tickets.triageNotes,
        module: tickets.module,
        createdAt: tickets.createdAt,
        calledAt: tickets.calledAt,
        attendedAt: tickets.attendedAt,
        finishedAt: tickets.finishedAt,
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          documentNumber: patients.documentNumber,
          documentType: patients.documentType,
          phone: patients.phone,
          birthDate: patients.birthDate,
        },
      })
      .from(tickets)
      .innerJoin(patients, eq(tickets.patientId, patients.id))
      .where(eq(tickets.id, id))
      .limit(1);

    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return ticket;
  }

  async create(dto: CreateTicketDto, createdBy: string) {
    const ticketNumber = await this.generateTicketNumber(dto.type);

    const [ticket] = await this.db
      .insert(tickets)
      .values({
        ticketNumber,
        patientId: dto.patientId,
        type: dto.type as any,
        priority: dto.priority as any || 'normal',
        triageNotes: dto.triageNotes,
        module: dto.module,
        createdBy,
      })
      .returning();

    return this.findOne(ticket.id);
  }

  async updateStatus(id: string, dto: UpdateTicketStatusDto, userId: string) {
    const ticket = await this.findOne(id);

    const validTransitions: Record<string, string[]> = {
      waiting: ['called', 'cancelled', 'no_show'],
      called: ['in_attention', 'waiting', 'no_show'],
      in_attention: ['finished', 'waiting'],
      finished: [],
      cancelled: [],
      no_show: [],
    };

    if (!validTransitions[ticket.status]?.includes(dto.status)) {
      throw new BadRequestException(`No se puede cambiar de ${ticket.status} a ${dto.status}`);
    }

    const updates: any = { status: dto.status };
    if (dto.status === 'called') { updates.calledAt = new Date(); updates.calledBy = userId; }
    if (dto.status === 'in_attention') updates.attendedAt = new Date();
    if (dto.status === 'finished') updates.finishedAt = new Date();

    await this.db.update(tickets).set(updates).where(eq(tickets.id, id));
    return this.findOne(id);
  }

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.db
      .select({
        status: tickets.status,
        type: tickets.type,
        total: count(),
      })
      .from(tickets)
      .where(and(gte(tickets.createdAt, today), lte(tickets.createdAt, tomorrow)))
      .groupBy(tickets.status, tickets.type);

    return result;
  }

  private async generateTicketNumber(type: string): Promise<string> {
    const prefix = type === 'emergency' ? 'E' : 'C';
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const [result] = await this.db
      .select({ total: count() })
      .from(tickets)
      .where(
        and(
          eq(tickets.type, type as any),
          gte(tickets.createdAt, new Date(new Date().setHours(0, 0, 0, 0))),
        ),
      );

    const seq = String(Number(result?.total ?? 0) + 1).padStart(3, '0');
    return `${prefix}-${today}-${seq}`;
  }
}
