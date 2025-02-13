import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  //사진 임시 저장 폴더 없으면 생성
  const uploadDir = './uploads';
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir);
    console.log('uploads folder is generated');
  }
  const app = await NestFactory.create(AppModule);

  // get configurations from .env
  const configService = app.get(ConfigService);

  // set CORS config
  const whitelist = [
    /http:\/\/localhost:3000/,
    /https:\/\/.*bbun.gistory.me/,
    /https:\/\/.*bbun-fe.pages.dev/,
  ];
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || whitelist.some((regex) => regex.test(origin))) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  });

  // set swagger config
  const config = new DocumentBuilder()
    .setTitle('BBun Finder API')
    .setDescription('API Document for Bbun backend!')
    .setVersion(configService.getOrThrow('API_VERSION'))
    .addTag('Bbunlineskates')
    .addOAuth2(
      {
        type: 'oauth2',
        scheme: 'bearer',
        in: 'header',
        bearerFormat: 'token',
        flows: {
          authorizationCode: {
            authorizationUrl: configService.getOrThrow('SWAGGER_AUTH_URL'),
            tokenUrl: configService.getOrThrow('SWAGGER_TOKEN_URL'),
            scopes: {
              openid: 'openid',
              email: 'email',
              profile: 'profile',
              student_id: 'student_id',
            },
          },
        },
      },
      'oauth2',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      oauth2RedirectUrl: `${configService.getOrThrow('API_URL')}/api/oauth2-redirect.html`,
      displayRequestDuration: true,
    },
  });
  // start server
  await app.listen(3000);
}
bootstrap();
