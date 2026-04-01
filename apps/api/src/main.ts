import "./instrument";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { SentryGlobalFilter } from "@sentry/nestjs/setup";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

const BANNED_SECRETS = ["change_me_access_secret", "change_me_refresh_secret"];

function validateProductionSecrets() {
  const isProd = process.env.NODE_ENV === "production";
  const required = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "DATABASE_URL"];

  for (const key of required) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required env var: ${key}`);
    }
    if (isProd && BANNED_SECRETS.includes(value)) {
      throw new Error(`${key} uses a banned default value — set a real secret for production`);
    }
  }
}

async function bootstrap() {
  validateProductionSecrets();

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const isProd = process.env.NODE_ENV === "production";
  const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim());

  if (isProd && !corsOrigin) {
    throw new Error("CORS_ORIGIN must be set in production");
  }

  app.useGlobalFilters(new SentryGlobalFilter());
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.setGlobalPrefix("api/v1");
  app.enableCors({
    credentials: true,
    origin: corsOrigin ?? true
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
