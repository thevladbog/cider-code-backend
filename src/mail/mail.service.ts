import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private config: ConfigService,
  ) {}

  async sendResetPasswordMail(userId: string, token: string, email: string) {
    const url = `${this.config.get('CLIENT_URL')}/login/reset?token=${token}&id=${userId}`;

    await this.mailerService.sendMail({
      to: email,
      from: '"Поддержка | BOTTLE [CODE]" <support@bottlecode.app>',
      subject: 'Подтверждение сброса пароля',
      template: './reset_password',
      context: {
        url,
      },
    });
  }
}
