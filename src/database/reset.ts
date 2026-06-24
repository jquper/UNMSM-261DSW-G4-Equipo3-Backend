import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

async function reset() {
  const useSSL = process.env.DATABASE_SSL === 'true';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });
  const db = drizzle(pool, { schema });

  console.log('🧹 Limpiando base de datos...');

  // Obtener tablas existentes del schema public
  const { rows } = await pool.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );
  const existingTables = new Set(rows.map((r) => r.tablename));

  const orderedTables = [
    'medication_order_items',
    'medication_orders',
    'pharmacy_inventory',
    'prescription_items',
    'prescriptions',
    'billing_transactions',
    'billing_accounts',
    'receipt_series',
    'cash_registers',
    'medical_records',
    'emergencies',
    'appointments',
    'tickets',
    'patients',
    'doctors',
    'specialties',
    'sessions',
    'users',
  ].filter((t) => existingTables.has(t));

  if (orderedTables.length === 0) {
    console.log('ℹ️  No hay tablas que limpiar.');
  } else {
    const tableList = orderedTables.map((t) => `"${t}"`).join(', ');
    await db.execute(sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`));
  }

  console.log('✅ Base de datos limpia.');
  await pool.end();
}

reset().catch((err) => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});
