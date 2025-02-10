import { CustomConfigService } from '@lib/custom-config';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private readonly customConfigService: CustomConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async sendEmailBbunline(emailList: string[]): Promise<void> {
    if (emailList.length === 0) {
      this.logger.log('No matching users to sned email.');
      return;
    }

    this.logger.log(`Sending emails to: ${emailList.join(', ')}`);

    //동시에 이메일을 보내기 때문에, 여러 개의 promise를 병렬로 관리하기 위해서 Promise.all 활용
    await Promise.all(
      emailList.map((email) =>
        this.mailerService
          .sendMail({
            to: email,
            from: `"BbunlineSkate Service"<${this.customConfigService.EMAIL_USER}>`,
            subject: '[BbunlineSkate] 당신의 뻔라인이 등록되었습니다.', //이메일 제목
            template: 'notification',
          })
          .catch((err) => {
            this.logger.error(
              `❌ Failed to send email to ${email}: ${err.message}`,
            );
          }),
      ),
    )
      .then(() => this.logger.log(`✅ All emails have been processed.`))
      .catch((err) => {
        this.logger.error(`🔥 Critical error in email sending: ${err.message}`);
        throw new Error('Email sending fail');
      });
  }
}
