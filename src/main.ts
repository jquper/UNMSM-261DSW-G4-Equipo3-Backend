import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3000);
  const frontendUrl = configService.get<string>(
    "http://localhost:5173",
    "https://clinica-api.linker.pe",
    "http://clinica-api.linker.pe",
  );

  // Security headers (OWASP) — scriptSrc allows 'unsafe-inline' for Swagger UI
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true },
      noSniff: true,
      xssFilter: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: frontendUrl,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Global prefix and versioning
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  // Global pipes - strict validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger / OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Clínica Privada API")
    .setDescription("API REST para la gestión de la clínica privada — UNMSM")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT", in: "header" },
      "access-token",
    )
    .addTag("Auth", "Autenticación y gestión de sesiones")
    .addTag("Users", "Gestión de usuarios del sistema")
    .addTag("Patients", "Gestión de pacientes")
    .addTag("Doctors", "Gestión de médicos")
    .addTag("Appointments", "Citas médicas")
    .addTag("Specialties", "Especialidades médicas")
    .addTag("Tickets", "Cola de atención / tickets")
    .addTag("Medical Records", "Historiales clínicos")
    .addTag("Prescriptions", "Recetas médicas")
    .addTag("Billing", "Facturación y pagos")
    .addTag("Emergencies", "Gestión de emergencias")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(port);
  console.log(`🏥 Clinica API running on http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
