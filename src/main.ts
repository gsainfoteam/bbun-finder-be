import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { CustomConfigService } from '@lib/custom-config';
import expressBasicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // get configurations from .env
  const customConfigService = app.get(CustomConfigService);

  app.use(
    ['/api'],
    expressBasicAuth({
      challenge: true,
      users: {
        [customConfigService.SWAGGER_USER]:
          customConfigService.SWAGGER_PASSWORD,
      },
    }),
  );

  // set CORS config
  const whitelist = [
    /http:\/\/localhost:3000/,
    /http:\/\/localhost:12345/,
    /https:\/\/.*bbun.gistory.me/,
    /https:\/\/bbun.gistory.me/,
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
    .setVersion(customConfigService.API_VERSION)
    .addTag('Bbunlineskates')
    .addOAuth2(
      {
        type: 'oauth2',
        scheme: 'bearer',
        in: 'header',
        bearerFormat: 'token',
        flows: {
          authorizationCode: {
            authorizationUrl: customConfigService.SWAGGER_AUTH_URL,
            tokenUrl: customConfigService.SWAGGER_TOKEN_URL,
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
      oauth2RedirectUrl: `${customConfigService.API_URL}/api/oauth2-redirect.html`,
      displayRequestDuration: true,
    },
  });
  // start server
  await app.listen(3000);
}
bootstrap();
