import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('🌱 Seeding database...');

  // Admin user
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  const [admin] = await db.insert(schema.users).values({
    email: 'admin@clinica.pe',
    password: hashedPassword,
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'admin',
  }).returning();

  console.log('✅ Admin user created:', admin.email);

  // Specialties
  const specialtiesData = [
    { name: 'Medicina General', description: 'Atención primaria y medicina general', color: '#3B82F6' },
    { name: 'Pediatría', description: 'Atención médica a niños y adolescentes', color: '#10B981' },
    { name: 'Ginecología', description: 'Salud femenina y obstetricia', color: '#F59E0B' },
    { name: 'Cardiología', description: 'Enfermedades del corazón', color: '#EF4444' },
    { name: 'Traumatología', description: 'Lesiones musculoesqueléticas', color: '#8B5CF6' },
    { name: 'Neurología', description: 'Enfermedades del sistema nervioso', color: '#06B6D4' },
    { name: 'Oftalmología', description: 'Salud ocular', color: '#84CC16' },
    { name: 'Dermatología', description: 'Enfermedades de la piel', color: '#F97316' },
    { name: 'Emergencias', description: 'Atención de urgencias y emergencias', color: '#DC2626' },
  ];

  const insertedSpecialties = await db.insert(schema.specialties).values(specialtiesData).returning();
  console.log(`✅ ${insertedSpecialties.length} specialties created`);

  // Doctor users
  const doctorPassword = await bcrypt.hash('Doctor123!', 12);
  const doctorUsers = await db.insert(schema.users).values([
    { email: 'dr.garcia@clinica.pe', password: doctorPassword, firstName: 'Carlos', lastName: 'García', role: 'doctor' },
    { email: 'dr.lopez@clinica.pe', password: doctorPassword, firstName: 'María', lastName: 'López', role: 'doctor' },
    { email: 'dr.torres@clinica.pe', password: doctorPassword, firstName: 'Juan', lastName: 'Torres', role: 'doctor' },
  ]).returning();

  await db.insert(schema.doctors).values([
    { userId: doctorUsers[0].id, specialtyId: insertedSpecialties[0].id, cmp: 'CMP-12345', consultationFee: '80.00' },
    { userId: doctorUsers[1].id, specialtyId: insertedSpecialties[1].id, cmp: 'CMP-67890', consultationFee: '90.00' },
    { userId: doctorUsers[2].id, specialtyId: insertedSpecialties[8].id, cmp: 'CMP-11111', consultationFee: '60.00' },
  ]);
  console.log('✅ Doctors created');

  // Receptionist
  const receptionPassword = await bcrypt.hash('Staff123!', 12);
  await db.insert(schema.users).values({
    email: 'recepcion@clinica.pe',
    password: receptionPassword,
    firstName: 'Ana',
    lastName: 'Martínez',
    role: 'receptionist',
  });
  console.log('✅ Receptionist created');

  // Sample patients
  await db.insert(schema.patients).values([
    {
      documentType: 'DNI',
      documentNumber: '12345678',
      firstName: 'Pedro',
      lastName: 'Ramírez',
      birthDate: '1985-03-15',
      gender: 'M',
      phone: '987654321',
      email: 'pedro.ramirez@email.com',
      bloodType: 'O+',
    },
    {
      documentType: 'DNI',
      documentNumber: '87654321',
      firstName: 'Lucía',
      lastName: 'Vásquez',
      birthDate: '1992-07-22',
      gender: 'F',
      phone: '965432187',
      bloodType: 'A+',
    },
  ]);
  console.log('✅ Sample patients created');

  console.log('\n📋 Credentials:');
  console.log('  Admin:        admin@clinica.pe / Admin123!');
  console.log('  Doctor:       dr.garcia@clinica.pe / Doctor123!');
  console.log('  Receptionist: recepcion@clinica.pe / Staff123!');

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
