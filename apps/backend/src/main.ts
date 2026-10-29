import { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { AppModule } from './app.module';
import { uploadsDir } from './common/upload/image-upload.config';

const KNOWN_PLACEHOLDER_JWT_SECRETS = new Set([
  'please-change-this-to-a-long-random-string',
  'change-me-to-a-long-random-string',
  'change-me',
  'changeme',
  'secret',
  'your-secret-here',
]);
const MIN_JWT_SECRET_LENGTH = 32;

const JWT_SECRET_STATE_FILE =
  process.env.JWT_SECRET_STATE_FILE ?? '/data/state/jwt-secret';

function isUsableSecret(secret: string): boolean {
  return (
    secret.length >= MIN_JWT_SECRET_LENGTH &&
    !KNOWN_PLACEHOLDER_JWT_SECRETS.has(secret.toLowerCase())
  );
}

function resolveJwtSecret(): string {
  const envSecret = (process.env.JWT_SECRET ?? '').trim();
  if (isUsableSecret(envSecret)) {
    return envSecret;
  }

  try {
    if (existsSync(JWT_SECRET_STATE_FILE)) {
      const persisted = readFileSync(JWT_SECRET_STATE_FILE, 'utf8').trim();
      if (isUsableSecret(persisted)) {
        return persisted;
      }
    }
    const generated = randomBytes(32).toString('hex');
    mkdirSync(dirname(JWT_SECRET_STATE_FILE), { recursive: true });
    writeFileSync(JWT_SECRET_STATE_FILE, generated, { mode: 0o600 });
    console.warn(
      "JWT_SECRET was not set (or was a known placeholder) - generated a random one and saved it to " + JWT_SECRET_STATE_FILE
    );
    return generated;
  } catch (err) {
    console.error(
      "Refusing to start: JWT_SECRET is missing or shorter than " + MIN_JWT_SECRET_LENGTH + " characters."
    );
    process.exit(1);
  }
}

async function bootstrap() {
  process.env.JWT_SECRET = resolveJwtSecret();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:1995',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useStaticAssets(uploadsDir(), { prefix: '/api/uploads/' });

  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true'
  ) {
    const config = new DocumentBuilder()
      .setTitle('BillBaaz API')
      .setDescription('REST API for the BillBaaz restaurant management system - Billing ka baazigar')
      .setVersion('1.0')
      .addCookieAuth('billbaaz_session')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log('BillBaaz API listening on :' + port + ' (docs at /api/docs)');
}
void bootstrap();
