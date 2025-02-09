import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { CustomConfigModule, CustomConfigService } from '@lib/custom-config';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
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
          from: `"BbunlineSkate Service"<${customConfigService.EMAIL_USER}>`, //from에 아무것도 없으면 전달되는 값
        },
        tls: {
          rejectUnauthorized: false,
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
