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

    await this.mailerService.sendMail({
      to: emailList,
      subject: '새로운 사용자가 등록되었습니다!',
      template: './templates/notification.hbs', //이메일 템플릿
    });

    //동시에 이메일을 보내기 때문에, 여러 개의 promise를 병렬로 관리하기 위해서 Promise.all 활용
    await Promise.all(
      emailList.map((email) =>
        this.mailerService
          .sendMail({
            //   to: 'noreply@example.com', //대표 주소(또는 무시)
            //   bcc: email, //모든 수신자를 BCC(blind carbon copy)로 설정(수신자들이 서로 못 보게 설정)
            to: emailList,
            from: `"BbunlineSkate Service"<${this.customConfigService.EMAIL_USER}>`,
            subject: '[BbunlineSkate] 당신의 뻔라인이 등록되었습니다.', //이메일 제목
            html: `<h1> 당신과 학번 뒷 4자리가 같은 누군가가 서비스에 등록되었습니다.</h1> <p> 당신의 뻔라인을 확인하러 가보세요! </p>`, //이메일 내용
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
