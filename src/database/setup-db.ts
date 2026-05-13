/**
 * Script de setup inicial: verifica y otorga permisos en el schema public.
 * Ejecutar ANTES de db:push si se usa PostgreSQL 15+ gestionado (DigitalOcean, Supabase, etc.)
 *
 * Uso: npx ts-node src/database/setup-db.ts
 */
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function setupDb() {
  const useSSL = process.env.DATABASE_SSL === 'true';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });

  const url = new URL(process.env.DATABASE_URL!);
  const dbUser = decodeURIComponent(url.username);
  const dbName = url.pathname.slice(1);

  console.log(`🔧 Verificando permisos en base de datos: ${dbName}`);
  console.log(`   Usuario: ${dbUser}`);

  const client = await pool.connect();
  try {
    // Verifica si el usuario ya tiene CREATE en el schema public
    const { rows } = await client.query(
      `SELECT has_schema_privilege($1, 'public', 'CREATE') as can_create`, [dbUser]
    );

    if (rows[0].can_create) {
      console.log('✅ El usuario ya tiene permisos CREATE en schema public.');
      console.log('   Puedes ejecutar: npm run db:push');
      return;
    }

    // Intenta otorgar permisos (solo funciona si el usuario es dueño del schema)
    console.log('⚠️  Sin permisos CREATE en schema public. Intentando GRANT...');
    try {
      await client.query(`GRANT ALL ON SCHEMA public TO "${dbUser}";`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}";`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}";`);

      // Verifica si el GRANT tuvo efecto
      const check = await client.query(
        `SELECT has_schema_privilege($1, 'public', 'CREATE') as can_create`, [dbUser]
      );

      if (check.rows[0].can_create) {
        console.log('✅ Permisos otorgados correctamente.');
        console.log('   Puedes ejecutar: npm run db:push');
      } else {
        printManualInstructions(dbUser);
      }
    } catch (err: any) {
      if (err.code === '42501') {
        printManualInstructions(dbUser);
      } else {
        console.error('❌ Error inesperado:', err.message);
      }
      process.exit(1);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

function printManualInstructions(dbUser: string) {
  console.error('\n❌ El usuario no tiene permisos para otorgar acceso al schema public.');
  console.error('   Debes ejecutar el siguiente SQL como administrador (doadmin):\n');
  console.error('─────────────────────────────────────────────────────────────────');
  console.error(`  GRANT ALL ON SCHEMA public TO "${dbUser}";`);
  console.error(`  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}";`);
  console.error(`  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${dbUser}";`);
  console.error('─────────────────────────────────────────────────────────────────');
  console.error('\n📋 Cómo hacerlo en DigitalOcean:');
  console.error('   1. Ir a: https://cloud.digitalocean.com/databases');
  console.error('   2. Clic en tu cluster de PostgreSQL');
  console.error('   3. Ir a la pestaña "Users & Databases"');
  console.error('   4. Usar la función "Console" del panel (o connectar como doadmin)');
  console.error('   5. Ejecutar las 3 sentencias SQL de arriba');
  console.error('\n   Alternativa con psql (requiere IP de tu máquina en trusted sources):');
  console.error(`   psql "postgresql://doadmin:<DOADMIN_PASS>@<HOST>:25060/${dbUser.replace('-user', '')}?sslmode=require"`);
  console.error('   Luego ejecutar los 3 GRANT\n');
}

setupDb();
