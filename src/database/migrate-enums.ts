/**
 * Agrega nuevos valores a enums existentes sin recrear las tablas.
 * Ejecutar cuando se añade un valor al schema que ya existe en la BD.
 *
 * Uso: npx ts-node src/database/migrate-enums.ts
 */
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrateEnums() {
  const useSSL = process.env.DATABASE_SSL === 'true';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  try {
    console.log('🔧 Migrando enums...');

    // user_role: agregar pharmacy_tech si no existe
    const { rows } = await client.query(`
      SELECT enumlabel FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'pharmacy_tech'
    `);

    if (rows.length === 0) {
      await client.query(`ALTER TYPE "user_role" ADD VALUE 'pharmacy_tech'`);
      console.log("✅ Valor 'pharmacy_tech' agregado al enum user_role");
    } else {
      console.log("ℹ️  El valor 'pharmacy_tech' ya existe en user_role");
    }

    console.log('\n✅ Migración de enums completada.');
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateEnums();
