import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { eq, desc, and, count, sql, lt, ilike, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import {
  pharmacyInventory,
  medicationOrders,
  medicationOrderItems,
  prescriptions,
  billingAccounts,
  billingTransactions,
} from '../database/schema';
import * as schema from '../database/schema';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  AdjustStockDto,
  DispensePrescriptionDto,
} from './dto/pharmacy.dto';

@Injectable()
export class PharmacyService {
  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  // ── Inventory ──────────────────────────────────────────────────────────────

  async findAllInventory(page = 1, limit = 20, lowStock = false, search?: string) {
    const offset = (page - 1) * limit;
    const conditions: any[] = [eq(pharmacyInventory.isActive, true)];
    if (lowStock) {
      conditions.push(sql`${pharmacyInventory.stock} <= ${pharmacyInventory.minStock}`);
    }
    if (search) {
      conditions.push(
        or(
          ilike(pharmacyInventory.medicationName, `%${search}%`),
          ilike(pharmacyInventory.genericName, `%${search}%`),
        ),
      );
    }
    const where = and(...conditions);

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(pharmacyInventory)
        .where(where)
        .orderBy(pharmacyInventory.medicationName)
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(pharmacyInventory).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOneInventory(id: string) {
    const [item] = await this.db
      .select()
      .from(pharmacyInventory)
      .where(eq(pharmacyInventory.id, id))
      .limit(1);

    if (!item) throw new NotFoundException('Medicamento no encontrado en inventario');
    return item;
  }

  async createInventoryItem(dto: CreateInventoryItemDto) {
    const [item] = await this.db
      .insert(pharmacyInventory)
      .values({
        medicationName: dto.medicationName,
        genericName: dto.genericName,
        presentation: dto.presentation,
        concentration: dto.concentration,
        laboratoryName: dto.laboratoryName,
        stock: dto.stock,
        minStock: dto.minStock ?? 5,
        unitPrice: dto.unitPrice,
        expirationDate: dto.expirationDate,
        lotNumber: dto.lotNumber,
        location: dto.location,
      })
      .returning();
    return item;
  }

  async updateInventoryItem(id: string, dto: UpdateInventoryItemDto) {
    await this.findOneInventory(id);
    const [updated] = await this.db
      .update(pharmacyInventory)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(pharmacyInventory.id, id))
      .returning();
    return updated;
  }

  async adjustStock(id: string, dto: AdjustStockDto) {
    const item = await this.findOneInventory(id);
    const newStock = item.stock + dto.quantity;
    if (newStock < 0) {
      throw new BadRequestException(`Stock insuficiente. Stock actual: ${item.stock}`);
    }
    const [updated] = await this.db
      .update(pharmacyInventory)
      .set({ stock: newStock, updatedAt: new Date() })
      .where(eq(pharmacyInventory.id, id))
      .returning();
    return updated;
  }

  async getLowStockAlerts() {
    return this.db
      .select()
      .from(pharmacyInventory)
      .where(
        and(
          eq(pharmacyInventory.isActive, true),
          sql`${pharmacyInventory.stock} <= ${pharmacyInventory.minStock}`,
        ),
      )
      .orderBy(pharmacyInventory.stock);
  }

  // ── Medication Orders (Dispensing) ─────────────────────────────────────────

  async findAllOrders(page = 1, limit = 20, status?: string) {
    const offset = (page - 1) * limit;
    const conditions: any[] = [];
    if (status) conditions.push(eq(medicationOrders.status, status as any));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, [{ total }]] = await Promise.all([
      this.db
        .select()
        .from(medicationOrders)
        .where(where)
        .orderBy(desc(medicationOrders.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(medicationOrders).where(where),
    ]);

    return { data, total: Number(total), page, limit };
  }

  async findOneOrder(id: string) {
    const [order] = await this.db
      .select()
      .from(medicationOrders)
      .where(eq(medicationOrders.id, id))
      .limit(1);

    if (!order) throw new NotFoundException('Orden de medicamentos no encontrada');

    const items = await this.db
      .select()
      .from(medicationOrderItems)
      .where(eq(medicationOrderItems.orderId, id));

    return { ...order, items };
  }

  async dispensePrescription(dto: DispensePrescriptionDto, dispensedBy: string) {
    const [prescription] = await this.db
      .select()
      .from(prescriptions)
      .where(eq(prescriptions.id, dto.prescriptionId))
      .limit(1);

    if (!prescription) throw new NotFoundException('Prescripción no encontrada');
    if (prescription.status !== 'active') {
      throw new BadRequestException(`La prescripción no está activa (estado: ${prescription.status})`);
    }

    // Verify stock and calculate total
    let totalAmount = 0;
    const resolvedItems: Array<{
      inventoryId: string;
      medicationName: string;
      requestedQuantity: number;
      dispensedQuantity: number;
      unitPrice: string;
      totalPrice: string;
    }> = [];

    for (const item of dto.items) {
      const inv = await this.findOneInventory(item.inventoryId);
      if (inv.stock < item.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para ${inv.medicationName}. Disponible: ${inv.stock}, solicitado: ${item.quantity}`,
        );
      }
      const unitPrice = parseFloat(inv.unitPrice);
      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;
      resolvedItems.push({
        inventoryId: item.inventoryId,
        medicationName: inv.medicationName,
        requestedQuantity: item.quantity,
        dispensedQuantity: item.quantity,
        unitPrice: inv.unitPrice,
        totalPrice: itemTotal.toFixed(2),
      });
    }

    // Create medication order
    const [order] = await this.db
      .insert(medicationOrders)
      .values({
        prescriptionId: dto.prescriptionId,
        patientId: prescription.patientId,
        dispensedBy,
        status: 'delivered',
        notes: dto.notes,
        totalAmount: totalAmount.toFixed(2),
        dispensedAt: new Date(),
      })
      .returning();

    // Insert order items and decrement stock
    for (const item of resolvedItems) {
      await this.db.insert(medicationOrderItems).values({
        orderId: order.id,
        inventoryId: item.inventoryId,
        medicationName: item.medicationName,
        requestedQuantity: item.requestedQuantity,
        dispensedQuantity: item.dispensedQuantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });

      await this.db
        .update(pharmacyInventory)
        .set({
          stock: sql`${pharmacyInventory.stock} - ${item.dispensedQuantity}`,
          updatedAt: new Date(),
        })
        .where(eq(pharmacyInventory.id, item.inventoryId));
    }

    // Mark prescription as dispensed
    await this.db
      .update(prescriptions)
      .set({ status: 'dispensed', updatedAt: new Date() })
      .where(eq(prescriptions.id, dto.prescriptionId));

    // Auto-create billing charge for the medicines
    const [account] = await this.db
      .select({ id: billingAccounts.id })
      .from(billingAccounts)
      .where(eq(billingAccounts.patientId, prescription.patientId))
      .limit(1);

    if (account) {
      await this.db.insert(billingTransactions).values({
        accountId: account.id,
        patientId: prescription.patientId,
        type: 'charge',
        concept: 'medicina',
        amount: totalAmount.toFixed(2),
        description: `Medicamentos despachados - Receta ${dto.prescriptionId.slice(0, 8)}`,
        referenceType: 'prescription',
        referenceId: dto.prescriptionId,
        status: 'pending',
        createdBy: dispensedBy,
      });

      await this.recalculateBalance(prescription.patientId);
    }

    return { order, items: resolvedItems, totalAmount: totalAmount.toFixed(2) };
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
