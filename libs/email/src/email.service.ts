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
      this.logger.log('No matching users to send email.');
      return;
    }

    this.logger.log(`Sending emails to: ${emailList.join(', ')}`);

    //동시에 이메일을 보내기 때문에, 여러 개의 promise를 병렬로 관리하기 위해서 Promise.all 활용
    await Promise.all(
      emailList.map((email) =>
        this.mailerService
          .sendMail({
            to: email,
            from: `"뻔라인스케이팅" <${this.customConfigService.EMAIL_USER}>`,
            subject: '🛼당신의 뻔라인에 새로운 사람이 추가되었어요🛼', //이메일 제목
            template: 'notification',
          })
          .catch((err) => {
            this.logger.error(`❌ Failed to send email to ${email}: ${err}`);
          }),
      ),
    )
      .then(() => this.logger.log(`✅ All emails have been processed.`))
      .catch((err) => {
        this.logger.error(`🔥 Critical error in email sending: ${err}`);
        throw new Error('Email sending fail');
      });
  }
}
