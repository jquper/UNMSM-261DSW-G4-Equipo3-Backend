import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  time,
  integer,
  decimal,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'doctor',
  'nurse',
  'receptionist',
  'cashier',
  'pharmacy_tech',
]);

export const documentTypeEnum = pgEnum('document_type', ['DNI', 'CE', 'PASAPORTE', 'RUC']);

export const genderEnum = pgEnum('gender', ['M', 'F', 'OTRO']);

export const bloodTypeEnum = pgEnum('blood_type', [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
]);

export const ticketTypeEnum = pgEnum('ticket_type', ['emergency', 'outpatient']);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'immediate',
  'very_urgent',
  'urgent',
  'normal',
  'non_urgent',
]);

export const ticketStatusEnum = pgEnum('ticket_status', [
  'waiting',
  'called',
  'in_attention',
  'finished',
  'cancelled',
  'no_show',
]);

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

export const emergencyStatusEnum = pgEnum('emergency_status', [
  'active',
  'in_treatment',
  'observation',
  'discharged',
  'transferred',
  'deceased',
]);

export const prescriptionStatusEnum = pgEnum('prescription_status', [
  'active',
  'dispensed',
  'expired',
  'cancelled',
]);

export const transactionTypeEnum = pgEnum('transaction_type', ['charge', 'payment', 'refund']);

export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'paid',
  'cancelled',
  'refunded',
]);

// ─── Users ─────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: text('password').notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').notNull().default('receptionist'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    roleIdx: index('users_role_idx').on(t.role),
  }),
);

// ─── Sessions (Multi-session JWT) ─────────────────────────────────────────────

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    deviceInfo: varchar('device_info', { length: 500 }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    isRevoked: boolean('is_revoked').notNull().default(false),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index('sessions_user_idx').on(t.userId),
    expiresIdx: index('sessions_expires_idx').on(t.expiresAt),
  }),
);

// ─── Specialties ───────────────────────────────────────────────────────────────

export const specialties = pgTable('specialties', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }).default('#3B82F6'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Doctors ───────────────────────────────────────────────────────────────────

export const doctors = pgTable(
  'doctors',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' })
      .unique(),
    specialtyId: uuid('specialty_id')
      .notNull()
      .references(() => specialties.id),
    cmp: varchar('cmp', { length: 20 }).notNull().unique(),
    consultationFee: decimal('consultation_fee', { precision: 10, scale: 2 }).notNull().default('0'),
    schedule: jsonb('schedule'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    cmpIdx: uniqueIndex('doctors_cmp_idx').on(t.cmp),
    specialtyIdx: index('doctors_specialty_idx').on(t.specialtyId),
  }),
);

// ─── Patients ──────────────────────────────────────────────────────────────────

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentType: documentTypeEnum('document_type').notNull(),
    documentNumber: varchar('document_number', { length: 20 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    birthDate: date('birth_date').notNull(),
    gender: genderEnum('gender').notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    district: varchar('district', { length: 100 }),
    bloodType: bloodTypeEnum('blood_type'),
    allergies: text('allergies'),
    chronicConditions: text('chronic_conditions'),
    emergencyContactName: varchar('emergency_contact_name', { length: 200 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    documentIdx: uniqueIndex('patients_document_idx').on(t.documentType, t.documentNumber),
    nameIdx: index('patients_name_idx').on(t.lastName, t.firstName),
  }),
);

// ─── Tickets ───────────────────────────────────────────────────────────────────

export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketNumber: varchar('ticket_number', { length: 20 }).notNull().unique(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    type: ticketTypeEnum('type').notNull(),
    priority: ticketPriorityEnum('priority').notNull().default('normal'),
    status: ticketStatusEnum('status').notNull().default('waiting'),
    triageNotes: text('triage_notes'),
    module: varchar('module', { length: 50 }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    calledBy: uuid('called_by').references(() => users.id),
    calledAt: timestamp('called_at'),
    attendedAt: timestamp('attended_at'),
    finishedAt: timestamp('finished_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    ticketNumberIdx: uniqueIndex('tickets_number_idx').on(t.ticketNumber),
    patientIdx: index('tickets_patient_idx').on(t.patientId),
    statusIdx: index('tickets_status_idx').on(t.status),
    dateIdx: index('tickets_date_idx').on(t.createdAt),
  }),
);

// ─── Appointments ──────────────────────────────────────────────────────────────

export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id),
    specialtyId: uuid('specialty_id')
      .notNull()
      .references(() => specialties.id),
    ticketId: uuid('ticket_id').references(() => tickets.id),
    appointmentDate: date('appointment_date').notNull(),
    appointmentTime: time('appointment_time').notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(20),
    status: appointmentStatusEnum('status').notNull().default('scheduled'),
    reason: text('reason'),
    notes: text('notes'),
    fee: decimal('fee', { precision: 10, scale: 2 }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    patientIdx: index('appointments_patient_idx').on(t.patientId),
    doctorDateIdx: index('appointments_doctor_date_idx').on(t.doctorId, t.appointmentDate),
    statusIdx: index('appointments_status_idx').on(t.status),
  }),
);

// ─── Emergencies ───────────────────────────────────────────────────────────────

export const emergencies = pgTable(
  'emergencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id)
      .unique(),
    doctorId: uuid('doctor_id').references(() => doctors.id),
    arrivalTime: timestamp('arrival_time').defaultNow().notNull(),
    triageLevel: integer('triage_level').notNull(),
    chiefComplaint: text('chief_complaint').notNull(),
    vitalSigns: jsonb('vital_signs'),
    status: emergencyStatusEnum('status').notNull().default('active'),
    bed: varchar('bed', { length: 20 }),
    dischargeTime: timestamp('discharge_time'),
    dischargeType: varchar('discharge_type', { length: 50 }),
    dischargeNotes: text('discharge_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    patientIdx: index('emergencies_patient_idx').on(t.patientId),
    statusIdx: index('emergencies_status_idx').on(t.status),
    triageIdx: index('emergencies_triage_idx').on(t.triageLevel),
  }),
);

// ─── Medical Records ───────────────────────────────────────────────────────────

export const medicalRecords = pgTable(
  'medical_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    appointmentId: uuid('appointment_id').references(() => appointments.id),
    emergencyId: uuid('emergency_id').references(() => emergencies.id),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id),
    anamnesis: text('anamnesis'),
    physicalExam: text('physical_exam'),
    diagnosis: text('diagnosis').notNull(),
    diagnosisCie10: varchar('diagnosis_cie10', { length: 10 }),
    treatment: text('treatment'),
    indications: text('indications'),
    labOrders: text('lab_orders'),
    imagingOrders: text('imaging_orders'),
    followUpDate: date('follow_up_date'),
    followUpNotes: text('follow_up_notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    patientIdx: index('medical_records_patient_idx').on(t.patientId),
    doctorIdx: index('medical_records_doctor_idx').on(t.doctorId),
    dateIdx: index('medical_records_date_idx').on(t.createdAt),
  }),
);

// ─── Prescriptions ─────────────────────────────────────────────────────────────

export const prescriptions = pgTable(
  'prescriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    medicalRecordId: uuid('medical_record_id')
      .notNull()
      .references(() => medicalRecords.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    doctorId: uuid('doctor_id')
      .notNull()
      .references(() => doctors.id),
    prescriptionDate: date('prescription_date').notNull(),
    status: prescriptionStatusEnum('status').notNull().default('active'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    patientIdx: index('prescriptions_patient_idx').on(t.patientId),
    dateIdx: index('prescriptions_date_idx').on(t.prescriptionDate),
  }),
);

export const prescriptionItems = pgTable('prescription_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  prescriptionId: uuid('prescription_id')
    .notNull()
    .references(() => prescriptions.id, { onDelete: 'cascade' }),
  medication: varchar('medication', { length: 255 }).notNull(),
  genericName: varchar('generic_name', { length: 255 }),
  presentation: varchar('presentation', { length: 100 }),
  dose: varchar('dose', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 100 }).notNull(),
  duration: varchar('duration', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull(),
  route: varchar('route', { length: 50 }),
  instructions: text('instructions'),
});

// ─── Billing ───────────────────────────────────────────────────────────────────

export const billingAccounts = pgTable(
  'billing_accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id)
      .unique(),
    balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0'),
    totalCharged: decimal('total_charged', { precision: 12, scale: 2 }).notNull().default('0'),
    totalPaid: decimal('total_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    patientIdx: uniqueIndex('billing_accounts_patient_idx').on(t.patientId),
  }),
);

export const billingTransactions = pgTable(
  'billing_transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => billingAccounts.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    type: transactionTypeEnum('type').notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    description: text('description').notNull(),
    referenceType: varchar('reference_type', { length: 50 }),
    referenceId: uuid('reference_id'),
    status: transactionStatusEnum('status').notNull().default('pending'),
    paidAt: timestamp('paid_at'),
    receiptNumber: varchar('receipt_number', { length: 50 }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    accountIdx: index('billing_transactions_account_idx').on(t.accountId),
    patientIdx: index('billing_transactions_patient_idx').on(t.patientId),
    statusIdx: index('billing_transactions_status_idx').on(t.status),
  }),
);

// ─── Relations ─────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  doctor: one(doctors, { fields: [users.id], references: [doctors.userId] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const specialtiesRelations = relations(specialties, ({ many }) => ({
  doctors: many(doctors),
  appointments: many(appointments),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  specialty: one(specialties, { fields: [doctors.specialtyId], references: [specialties.id] }),
  appointments: many(appointments),
  emergencies: many(emergencies),
  medicalRecords: many(medicalRecords),
  prescriptions: many(prescriptions),
}));

export const patientsRelations = relations(patients, ({ many, one }) => ({
  tickets: many(tickets),
  appointments: many(appointments),
  emergencies: many(emergencies),
  medicalRecords: many(medicalRecords),
  prescriptions: many(prescriptions),
  billingAccount: one(billingAccounts, { fields: [patients.id], references: [billingAccounts.patientId] }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  patient: one(patients, { fields: [tickets.patientId], references: [patients.id] }),
  createdByUser: one(users, { fields: [tickets.createdBy], references: [users.id] }),
  appointment: one(appointments, { fields: [tickets.id], references: [appointments.ticketId] }),
  emergency: one(emergencies, { fields: [tickets.id], references: [emergencies.ticketId] }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
  specialty: one(specialties, { fields: [appointments.specialtyId], references: [specialties.id] }),
  ticket: one(tickets, { fields: [appointments.ticketId], references: [tickets.id] }),
  medicalRecord: one(medicalRecords, { fields: [appointments.id], references: [medicalRecords.appointmentId] }),
}));

export const emergenciesRelations = relations(emergencies, ({ one }) => ({
  patient: one(patients, { fields: [emergencies.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [emergencies.doctorId], references: [doctors.id] }),
  ticket: one(tickets, { fields: [emergencies.ticketId], references: [tickets.id] }),
  medicalRecord: one(medicalRecords, { fields: [emergencies.id], references: [medicalRecords.emergencyId] }),
}));

export const medicalRecordsRelations = relations(medicalRecords, ({ one, many }) => ({
  patient: one(patients, { fields: [medicalRecords.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [medicalRecords.doctorId], references: [doctors.id] }),
  appointment: one(appointments, { fields: [medicalRecords.appointmentId], references: [appointments.id] }),
  emergency: one(emergencies, { fields: [medicalRecords.emergencyId], references: [emergencies.id] }),
  prescriptions: many(prescriptions),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one, many }) => ({
  medicalRecord: one(medicalRecords, { fields: [prescriptions.medicalRecordId], references: [medicalRecords.id] }),
  patient: one(patients, { fields: [prescriptions.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [prescriptions.doctorId], references: [doctors.id] }),
  items: many(prescriptionItems),
}));

export const prescriptionItemsRelations = relations(prescriptionItems, ({ one }) => ({
  prescription: one(prescriptions, { fields: [prescriptionItems.prescriptionId], references: [prescriptions.id] }),
}));

export const billingAccountsRelations = relations(billingAccounts, ({ one, many }) => ({
  patient: one(patients, { fields: [billingAccounts.patientId], references: [patients.id] }),
  transactions: many(billingTransactions),
}));

export const billingTransactionsRelations = relations(billingTransactions, ({ one }) => ({
  account: one(billingAccounts, { fields: [billingTransactions.accountId], references: [billingAccounts.id] }),
  patient: one(patients, { fields: [billingTransactions.patientId], references: [patients.id] }),
  createdByUser: one(users, { fields: [billingTransactions.createdBy], references: [users.id] }),
}));
