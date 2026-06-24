import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { TicketsModule } from './tickets/tickets.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { EmergenciesModule } from './emergencies/emergencies.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { BillingModule } from './billing/billing.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { CashRegisterModule } from './cash-register/cash-register.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    RedisModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    DoctorsModule,
    SpecialtiesModule,
    TicketsModule,
    AppointmentsModule,
    EmergenciesModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    BillingModule,
    PharmacyModule,
    CashRegisterModule,
  ],
})
export class AppModule {}
