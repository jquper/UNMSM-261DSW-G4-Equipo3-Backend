import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  const useSSL = process.env.DATABASE_SSL === 'true';
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
  });
  const db = drizzle(pool, { schema });

  console.log('🌱 Sembrando base de datos...\n');

  // ─── Usuarios ──────────────────────────────────────────────────────────────

  const adminHash     = await bcrypt.hash('Admin123!', 12);
  const doctorHash    = await bcrypt.hash('Doctor123!', 12);
  const staffHash     = await bcrypt.hash('Staff123!', 12);

  const [admin] = await db.insert(schema.users).values({
    email: 'admin@clinica.pe',
    password: adminHash,
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'admin',
  }).returning();
  console.log('✅ Admin creado:', admin.email);

  await db.insert(schema.users).values({
    email: 'recepcion@clinica.pe',
    password: staffHash,
    firstName: 'Ana',
    lastName: 'Martínez',
    role: 'receptionist',
  });

  const [cashier] = await db.insert(schema.users).values({
    email: 'caja@clinica.pe',
    password: staffHash,
    firstName: 'Rosa',
    lastName: 'Quispe',
    role: 'cashier',
  }).returning();

  await db.insert(schema.users).values({
    email: 'farmacia@clinica.pe',
    password: staffHash,
    firstName: 'Luis',
    lastName: 'Mendoza',
    role: 'pharmacy_tech',
  });

  await db.insert(schema.users).values({
    email: 'enfermeria@clinica.pe',
    password: staffHash,
    firstName: 'Carmen',
    lastName: 'Huanca',
    role: 'nurse',
  });

  console.log('✅ Personal de soporte creado (recepción, caja, farmacia, enfermería)');

  // ─── Especialidades ────────────────────────────────────────────────────────

  const specialtiesData = [
    { name: 'Medicina General',  description: 'Atención primaria y medicina general',         color: '#3B82F6' },
    { name: 'Pediatría',         description: 'Atención médica a niños y adolescentes',        color: '#10B981' },
    { name: 'Ginecología',       description: 'Salud femenina y obstetricia',                  color: '#F59E0B' },
    { name: 'Cardiología',       description: 'Enfermedades del corazón y sistema circulatorio', color: '#EF4444' },
    { name: 'Traumatología',     description: 'Lesiones musculoesqueléticas y fracturas',      color: '#8B5CF6' },
    { name: 'Neurología',        description: 'Enfermedades del sistema nervioso',             color: '#06B6D4' },
    { name: 'Oftalmología',      description: 'Salud ocular y cirugía de ojos',               color: '#84CC16' },
    { name: 'Dermatología',      description: 'Enfermedades de la piel, cabello y uñas',      color: '#F97316' },
    { name: 'Emergencias',       description: 'Atención de urgencias y emergencias 24/7',     color: '#DC2626' },
  ];

  const insertedSpecialties = await db.insert(schema.specialties).values(specialtiesData).returning();
  console.log(`✅ ${insertedSpecialties.length} especialidades creadas`);

  const sp = Object.fromEntries(insertedSpecialties.map((s) => [s.name, s]));

  // ─── Médicos ───────────────────────────────────────────────────────────────

  const doctorUsersData = [
    { email: 'dr.garcia@clinica.pe',    firstName: 'Carlos',   lastName: 'García Ruiz',     role: 'doctor' as const },
    { email: 'dr.lopez@clinica.pe',     firstName: 'María',    lastName: 'López Sánchez',   role: 'doctor' as const },
    { email: 'dr.torres@clinica.pe',    firstName: 'Juan',     lastName: 'Torres Vega',     role: 'doctor' as const },
    { email: 'dr.rojas@clinica.pe',     firstName: 'Patricia', lastName: 'Rojas Flores',    role: 'doctor' as const },
    { email: 'dr.chavez@clinica.pe',    firstName: 'Roberto',  lastName: 'Chávez Pérez',    role: 'doctor' as const },
    { email: 'dr.mendez@clinica.pe',    firstName: 'Sandra',   lastName: 'Méndez Castro',   role: 'doctor' as const },
    { email: 'dr.vargas@clinica.pe',    firstName: 'Andrés',   lastName: 'Vargas Díaz',     role: 'doctor' as const },
    { email: 'dr.paredes@clinica.pe',   firstName: 'Claudia',  lastName: 'Paredes Luna',    role: 'doctor' as const },
    { email: 'dr.quispe@clinica.pe',    firstName: 'Miguel',   lastName: 'Quispe Mamani',   role: 'doctor' as const },
  ];

  const doctorUsers = await db.insert(schema.users).values(
    doctorUsersData.map((u) => ({ ...u, password: doctorHash }))
  ).returning();

  const doctorRecords = [
    { userId: doctorUsers[0].id, specialtyId: sp['Medicina General'].id,  cmp: 'CMP-12345', consultationFee: '80.00' },
    { userId: doctorUsers[1].id, specialtyId: sp['Pediatría'].id,          cmp: 'CMP-67890', consultationFee: '90.00' },
    { userId: doctorUsers[2].id, specialtyId: sp['Ginecología'].id,         cmp: 'CMP-11111', consultationFee: '100.00' },
    { userId: doctorUsers[3].id, specialtyId: sp['Cardiología'].id,         cmp: 'CMP-22222', consultationFee: '120.00' },
    { userId: doctorUsers[4].id, specialtyId: sp['Traumatología'].id,       cmp: 'CMP-33333', consultationFee: '110.00' },
    { userId: doctorUsers[5].id, specialtyId: sp['Neurología'].id,          cmp: 'CMP-44444', consultationFee: '130.00' },
    { userId: doctorUsers[6].id, specialtyId: sp['Oftalmología'].id,        cmp: 'CMP-55555', consultationFee: '95.00' },
    { userId: doctorUsers[7].id, specialtyId: sp['Dermatología'].id,        cmp: 'CMP-66666', consultationFee: '85.00' },
    { userId: doctorUsers[8].id, specialtyId: sp['Emergencias'].id,         cmp: 'CMP-77777', consultationFee: '60.00' },
  ];

  await db.insert(schema.doctors).values(doctorRecords);
  console.log(`✅ ${doctorRecords.length} médicos creados (uno por especialidad)`);

  // ─── Pacientes ─────────────────────────────────────────────────────────────

  const patientsData = [
    {
      documentType: 'DNI' as const, documentNumber: '12345678',
      firstName: 'Pedro',    lastName: 'Ramírez Torres',
      birthDate: '1985-03-15', gender: 'M' as const,
      phone: '987654321', email: 'pedro.ramirez@email.com',
      bloodType: 'O+' as const, district: 'San Isidro',
      address: 'Av. Javier Prado 1234, San Isidro',
      emergencyContactName: 'María Ramírez', emergencyContactPhone: '987111222',
    },
    {
      documentType: 'DNI' as const, documentNumber: '87654321',
      firstName: 'Lucía',    lastName: 'Vásquez Huamán',
      birthDate: '1992-07-22', gender: 'F' as const,
      phone: '965432187', email: 'lucia.vasquez@email.com',
      bloodType: 'A+' as const, district: 'Miraflores',
      address: 'Calle Lima 456, Miraflores',
      allergies: 'Penicilina',
    },
    {
      documentType: 'DNI' as const, documentNumber: '45678901',
      firstName: 'Jorge',    lastName: 'Mendoza Ríos',
      birthDate: '1978-11-08', gender: 'M' as const,
      phone: '951234567', email: 'jorge.mendoza@email.com',
      bloodType: 'B+' as const, district: 'Surco',
      address: 'Jr. Huallaga 789, Santiago de Surco',
      chronicConditions: 'Diabetes tipo 2, Hipertensión',
    },
    {
      documentType: 'DNI' as const, documentNumber: '23456789',
      firstName: 'Carmen',   lastName: 'Flores Ccasa',
      birthDate: '2015-05-20', gender: 'F' as const,
      phone: '976543210', email: 'carmen.flores@email.com',
      bloodType: 'AB+' as const, district: 'Pueblo Libre',
      address: 'Av. Brasil 321, Pueblo Libre',
      emergencyContactName: 'Rosa Ccasa', emergencyContactPhone: '976543211',
    },
    {
      documentType: 'DNI' as const, documentNumber: '34567890',
      firstName: 'Roberto',  lastName: 'Sánchez Vargas',
      birthDate: '1965-09-12', gender: 'M' as const,
      phone: '942345678', email: 'roberto.sanchez@email.com',
      bloodType: 'A-' as const, district: 'Jesús María',
      address: 'Calle Cusco 567, Jesús María',
      chronicConditions: 'Hipertensión arterial',
      allergies: 'Ibuprofeno',
    },
    {
      documentType: 'DNI' as const, documentNumber: '56789012',
      firstName: 'María',    lastName: 'Quispe Mamani',
      birthDate: '1990-02-28', gender: 'F' as const,
      phone: '933456789', email: 'maria.quispe@email.com',
      bloodType: 'O-' as const, district: 'Lince',
      address: 'Av. Arequipa 890, Lince',
    },
    {
      documentType: 'DNI' as const, documentNumber: '67890123',
      firstName: 'Carlos',   lastName: 'Huanca Apaza',
      birthDate: '1972-06-15', gender: 'M' as const,
      phone: '924567890', email: 'carlos.huanca@email.com',
      bloodType: 'B-' as const, district: 'Barranco',
      address: 'Jr. Unión 123, Barranco',
      chronicConditions: 'Artritis reumatoide',
    },
    {
      documentType: 'DNI' as const, documentNumber: '78901234',
      firstName: 'Ana',      lastName: 'Torres Puma',
      birthDate: '1998-12-03', gender: 'F' as const,
      phone: '915678901', email: 'ana.torres@email.com',
      bloodType: 'A+' as const, district: 'Chorrillos',
      address: 'Av. Huaylas 456, Chorrillos',
    },
    {
      documentType: 'DNI' as const, documentNumber: '89012345',
      firstName: 'Luis',     lastName: 'Castillo Reyes',
      birthDate: '1958-04-25', gender: 'M' as const,
      phone: '906789012', email: 'luis.castillo@email.com',
      bloodType: 'AB-' as const, district: 'La Molina',
      address: 'Calle Los Álamos 789, La Molina',
      chronicConditions: 'Insuficiencia cardíaca, Diabetes tipo 2',
      allergies: 'Sulfamidas',
      emergencyContactName: 'Gloria Reyes', emergencyContactPhone: '906789013',
    },
    {
      documentType: 'DNI' as const, documentNumber: '90123456',
      firstName: 'Sofía',    lastName: 'Paredes Ccoicca',
      birthDate: '2008-08-17', gender: 'F' as const,
      phone: '997890123', email: 'sofia.paredes@email.com',
      bloodType: 'O+' as const, district: 'San Borja',
      address: 'Av. Angamos 012, San Borja',
      emergencyContactName: 'Patricia Ccoicca', emergencyContactPhone: '997890124',
    },
    {
      documentType: 'CE' as const, documentNumber: 'CE001234',
      firstName: 'Jean',     lastName: 'Martínez López',
      birthDate: '1988-01-30', gender: 'M' as const,
      phone: '988901234', email: 'jean.martinez@email.com',
      bloodType: 'A+' as const, district: 'Miraflores',
      address: 'Av. Larco 345, Miraflores',
    },
    {
      documentType: 'DNI' as const, documentNumber: '11223344',
      firstName: 'Gabriela', lastName: 'Chávez Sucari',
      birthDate: '1980-07-11', gender: 'F' as const,
      phone: '979012345', email: 'gabriela.chavez@email.com',
      bloodType: 'B+' as const, district: 'San Miguel',
      address: 'Jr. Callao 678, San Miguel',
      allergies: 'Aspirina, Látex',
      chronicConditions: 'Asma bronquial',
    },
    {
      documentType: 'DNI' as const, documentNumber: '55667788',
      firstName: 'Ricardo',  lastName: 'Palomino Cruz',
      birthDate: '1945-03-05', gender: 'M' as const,
      phone: '970123456',
      bloodType: 'O+' as const, district: 'Rímac',
      address: 'Av. Prolongación Tacna 901, Rímac',
      chronicConditions: 'Hipertensión, EPOC',
      emergencyContactName: 'Jorge Palomino', emergencyContactPhone: '970123457',
    },
    {
      documentType: 'DNI' as const, documentNumber: '99887766',
      firstName: 'Valeria',  lastName: 'Salazar Neira',
      birthDate: '2001-10-22', gender: 'F' as const,
      phone: '961234567', email: 'valeria.salazar@email.com',
      bloodType: 'A-' as const, district: 'Surquillo',
      address: 'Calle Angamos Este 234, Surquillo',
    },
    {
      documentType: 'DNI' as const, documentNumber: '44556677',
      firstName: 'Fernando', lastName: 'Zúñiga Benites',
      birthDate: '1975-12-18', gender: 'M' as const,
      phone: '952345678', email: 'fernando.zuniga@email.com',
      bloodType: 'B+' as const, district: 'San Martín de Porres',
      address: 'Av. Universitaria 567, SMP',
      chronicConditions: 'Obesidad mórbida, Hipertensión',
    },
  ];

  const insertedPatients = await db.insert(schema.patients).values(patientsData).returning();
  console.log(`✅ ${insertedPatients.length} pacientes creados`);

  // ─── Series de comprobantes ────────────────────────────────────────────────

  await db.insert(schema.receiptSeries).values([
    { type: 'boleta',   prefix: 'B001', currentNumber: 0, isActive: true },
    { type: 'factura',  prefix: 'F001', currentNumber: 0, isActive: true },
  ]);
  console.log('✅ Series de comprobantes creadas (boleta B001, factura F001)');

  // ─── Caja registradora ─────────────────────────────────────────────────────

  await db.insert(schema.cashRegisters).values({
    name: 'Caja Principal',
    assignedUserId: cashier.id,
    status: 'open',
    openingBalance: '500.00',
    openedAt: new Date(),
  });
  console.log('✅ Caja principal abierta asignada a cajera');

  // ─── Inventario de farmacia ────────────────────────────────────────────────

  const medications = [
    { medicationName: 'Paracetamol 500mg',        genericName: 'Acetaminofén',       presentation: 'Tabletas x 20',  concentration: '500mg',  stock: 200, minStock: 30, unitPrice: '0.50',  expirationDate: '2026-12-31', lotNumber: 'LOT001', location: 'Anaquel A1' },
    { medicationName: 'Ibuprofeno 400mg',          genericName: 'Ibuprofeno',         presentation: 'Tabletas x 20',  concentration: '400mg',  stock: 150, minStock: 25, unitPrice: '0.80',  expirationDate: '2026-10-31', lotNumber: 'LOT002', location: 'Anaquel A2' },
    { medicationName: 'Amoxicilina 500mg',         genericName: 'Amoxicilina',        presentation: 'Cápsulas x 21',  concentration: '500mg',  stock: 80,  minStock: 15, unitPrice: '1.20',  expirationDate: '2026-08-31', lotNumber: 'LOT003', location: 'Anaquel B1' },
    { medicationName: 'Omeprazol 20mg',            genericName: 'Omeprazol',          presentation: 'Cápsulas x 14',  concentration: '20mg',   stock: 120, minStock: 20, unitPrice: '0.60',  expirationDate: '2027-03-31', lotNumber: 'LOT004', location: 'Anaquel B2' },
    { medicationName: 'Metformina 850mg',          genericName: 'Metformina HCl',     presentation: 'Tabletas x 30',  concentration: '850mg',  stock: 90,  minStock: 20, unitPrice: '0.40',  expirationDate: '2026-11-30', lotNumber: 'LOT005', location: 'Anaquel C1' },
    { medicationName: 'Losartán 50mg',             genericName: 'Losartán potásico',  presentation: 'Tabletas x 30',  concentration: '50mg',   stock: 100, minStock: 20, unitPrice: '0.55',  expirationDate: '2027-01-31', lotNumber: 'LOT006', location: 'Anaquel C2' },
    { medicationName: 'Atorvastatina 20mg',        genericName: 'Atorvastatina',      presentation: 'Tabletas x 30',  concentration: '20mg',   stock: 75,  minStock: 15, unitPrice: '1.00',  expirationDate: '2026-09-30', lotNumber: 'LOT007', location: 'Anaquel C3' },
    { medicationName: 'Salbutamol Inhalador',      genericName: 'Salbutamol',         presentation: 'Inhalador 200d', concentration: '100mcg', stock: 40,  minStock: 10, unitPrice: '18.00', expirationDate: '2026-07-31', lotNumber: 'LOT008', location: 'Anaquel D1' },
    { medicationName: 'Ciprofloxacino 500mg',      genericName: 'Ciprofloxacino',     presentation: 'Tabletas x 10',  concentration: '500mg',  stock: 60,  minStock: 10, unitPrice: '1.50',  expirationDate: '2026-06-30', lotNumber: 'LOT009', location: 'Anaquel B3' },
    { medicationName: 'Diclofenaco 50mg',          genericName: 'Diclofenaco sódico', presentation: 'Tabletas x 20',  concentration: '50mg',   stock: 110, minStock: 20, unitPrice: '0.35',  expirationDate: '2027-02-28', lotNumber: 'LOT010', location: 'Anaquel A3' },
    { medicationName: 'Ranitidina 150mg',          genericName: 'Ranitidina HCl',     presentation: 'Tabletas x 20',  concentration: '150mg',  stock: 85,  minStock: 15, unitPrice: '0.45',  expirationDate: '2026-10-31', lotNumber: 'LOT011', location: 'Anaquel B4' },
    { medicationName: 'Clonazepam 0.5mg',          genericName: 'Clonazepam',         presentation: 'Tabletas x 20',  concentration: '0.5mg',  stock: 30,  minStock: 5,  unitPrice: '0.90',  expirationDate: '2026-12-31', lotNumber: 'LOT012', location: 'Anaquel E1' },
    { medicationName: 'Insulina NPH 100UI/mL',     genericName: 'Insulina isofánica', presentation: 'Vial 10mL',      concentration: '100UI',  stock: 25,  minStock: 5,  unitPrice: '45.00', expirationDate: '2026-09-30', lotNumber: 'LOT013', location: 'Refrigerador F1' },
    { medicationName: 'Azitromicina 500mg',        genericName: 'Azitromicina',       presentation: 'Tabletas x 3',   concentration: '500mg',  stock: 55,  minStock: 10, unitPrice: '3.50',  expirationDate: '2027-04-30', lotNumber: 'LOT014', location: 'Anaquel B5' },
    { medicationName: 'Vitamina C 1000mg',         genericName: 'Ácido ascórbico',    presentation: 'Tabletas x 30',  concentration: '1000mg', stock: 180, minStock: 30, unitPrice: '0.30',  expirationDate: '2027-06-30', lotNumber: 'LOT015', location: 'Anaquel A4' },
    { medicationName: 'Dexametasona 4mg/mL',       genericName: 'Dexametasona',       presentation: 'Ampolla 2mL',    concentration: '4mg/mL', stock: 50,  minStock: 10, unitPrice: '3.00',  expirationDate: '2026-11-30', lotNumber: 'LOT016', location: 'Anaquel E2' },
    { medicationName: 'Furosemida 40mg',           genericName: 'Furosemida',         presentation: 'Tabletas x 20',  concentration: '40mg',   stock: 65,  minStock: 10, unitPrice: '0.50',  expirationDate: '2027-01-31', lotNumber: 'LOT017', location: 'Anaquel C4' },
    { medicationName: 'Tramadol 50mg',             genericName: 'Tramadol HCl',       presentation: 'Cápsulas x 10',  concentration: '50mg',   stock: 35,  minStock: 5,  unitPrice: '1.80',  expirationDate: '2026-08-31', lotNumber: 'LOT018', location: 'Anaquel E3' },
    { medicationName: 'Ranitidina 50mg/2mL amp',  genericName: 'Ranitidina',          presentation: 'Ampolla 2mL',    concentration: '50mg',   stock: 40,  minStock: 8,  unitPrice: '2.50',  expirationDate: '2026-09-30', lotNumber: 'LOT019', location: 'Anaquel E4' },
    { medicationName: 'Agua Destilada 1L',         genericName: 'Agua para inyección', presentation: 'Bolsa 1L',      concentration: 'N/A',    stock: 60,  minStock: 10, unitPrice: '4.00',  expirationDate: '2027-06-30', lotNumber: 'LOT020', location: 'Almacén G1' },
  ];

  await db.insert(schema.pharmacyInventory).values(medications as any);
  console.log(`✅ ${medications.length} medicamentos en inventario de farmacia`);

  // ─── Resumen de credenciales ───────────────────────────────────────────────

  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│                    CREDENCIALES DEL SISTEMA                      │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│  ADMIN:         admin@clinica.pe          / Admin123!            │');
  console.log('│  RECEPCIÓN:     recepcion@clinica.pe      / Staff123!            │');
  console.log('│  CAJA:          caja@clinica.pe           / Staff123!            │');
  console.log('│  FARMACIA:      farmacia@clinica.pe       / Staff123!            │');
  console.log('│  ENFERMERÍA:    enfermeria@clinica.pe     / Staff123!            │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  console.log('│  MÉDICOS (password: Doctor123!):                                 │');
  console.log('│    dr.garcia@clinica.pe    → Medicina General                    │');
  console.log('│    dr.lopez@clinica.pe     → Pediatría                           │');
  console.log('│    dr.torres@clinica.pe    → Ginecología                         │');
  console.log('│    dr.rojas@clinica.pe     → Cardiología                         │');
  console.log('│    dr.chavez@clinica.pe    → Traumatología                       │');
  console.log('│    dr.mendez@clinica.pe    → Neurología                          │');
  console.log('│    dr.vargas@clinica.pe    → Oftalmología                        │');
  console.log('│    dr.paredes@clinica.pe   → Dermatología                        │');
  console.log('│    dr.quispe@clinica.pe    → Emergencias                         │');
  console.log('└─────────────────────────────────────────────────────────────────┘');
  console.log(`\n📊 Resumen:`);
  console.log(`   • 1 admin + 4 personal de soporte + 9 médicos = 14 usuarios`);
  console.log(`   • 9 especialidades`);
  console.log(`   • 15 pacientes`);
  console.log(`   • 2 series de comprobantes (boleta B001, factura F001)`);
  console.log(`   • 1 caja registradora abierta`);
  console.log(`   • ${medications.length} medicamentos en farmacia\n`);

  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed falló:', err);
  process.exit(1);
});
