import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { CustomConfigModule, CustomConfigService } from '@lib/custom-config';
import { MailerModule } from '@nestjs-modules/mailer';
import * as path from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CustomConfigModule,
        MailerModule.forRootAsync({
          imports: [CustomConfigModule],
          inject: [CustomConfigService],
          useFactory: (customConfigService: CustomConfigService) => ({
            transport: {
              host: customConfigService.EMAIL_HOST,
              port: customConfigService.EMAIL_PORT,
              secure: true,
              auth: {
                type: 'oauth2',
                user: customConfigService.EMAIL_USER,
                serviceClient: customConfigService.EMAIL_SERVICE_CLIENT,
                privateKey: customConfigService.EMAIL_PRIVATE_KEY?.replace(
                  /\\n/g,
                  '\n',
                ),
                accessUrl: customConfigService.EMAIL_ACCESS_URL,
              },
            },
            defaults: {
              from: `"BbunlineSkate Service" <${customConfigService.EMAIL_USER}>`, //from에 아무것도 없으면 전달되는 값
            },
            tls: {
              rejectUnauthorized: false,
            },

            template: {
              dir: path.resolve(__dirname, '..', 'libs', 'email', 'templates'),
              adapter: new HandlebarsAdapter(),
              options: {
                strict: true,
              },
            },
          }),
        }),
      ],
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
