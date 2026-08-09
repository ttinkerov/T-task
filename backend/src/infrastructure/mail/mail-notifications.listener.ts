import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import {
  DomainEvents,
  DueReminderPayload,
  InvitationCreatedPayload,
  MentionCreatedPayload,
} from '../../common/events/domain-events';
import { escapeHtml, MailService } from '../../infrastructure/mail/mail.service';

@Injectable()
export class MailNotificationsListener {
  constructor(
    private readonly mail: MailService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(DomainEvents.INVITATION_CREATED)
  async onInvitation(payload: InvitationCreatedPayload) {
    if (!payload.sendEmail) return;
    const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
    const link = `${appUrl.replace(/\/$/, '')}/invite/${payload.token}`;
    await this.mail.send({
      to: payload.email,
      subject: `Приглашение в ${payload.workspaceName}`,
      text: `${payload.inviterName} приглашает вас в «${payload.workspaceName}». Откройте: ${link}`,
      html: `<p>${escapeHtml(payload.inviterName)} приглашает вас в <strong>${escapeHtml(payload.workspaceName)}</strong> (роль: ${escapeHtml(payload.role)}).</p><p><a href="${escapeHtml(link)}">Принять приглашение</a></p>`,
    });
  }

  @OnEvent(DomainEvents.MENTION_CREATED)
  async onMention(payload: MentionCreatedPayload) {
    const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
    const link = `${appUrl.replace(/\/$/, '')}/dashboard/boards?task=${payload.taskId}`;
    await this.mail.send({
      to: payload.recipientEmail,
      subject: `${payload.actorName} упомянул(а) вас`,
      text: `${payload.actorName}: ${payload.preview}\n${link}`,
      html: `<p><strong>${escapeHtml(payload.actorName)}</strong> упомянул(а) вас:</p><blockquote>${escapeHtml(payload.preview)}</blockquote><p><a href="${escapeHtml(link)}">Открыть задачу</a></p>`,
    });
  }

  @OnEvent(DomainEvents.DUE_REMINDER)
  async onDueReminder(payload: DueReminderPayload) {
    const appUrl = this.configService.get<string>('APP_URL') ?? 'http://localhost:3000';
    const link = `${appUrl.replace(/\/$/, '')}/dashboard/boards?task=${payload.taskId}`;
    await this.mail.send({
      to: payload.recipientEmail,
      subject: `Дедлайн: ${payload.taskTitle}`,
      text: `Задача «${payload.taskTitle}» скоро истекает (${payload.dueDate}).\n${link}`,
      html: `<p>Задача <strong>${escapeHtml(payload.taskTitle)}</strong> скоро истекает (${escapeHtml(payload.dueDate)}).</p><p><a href="${escapeHtml(link)}">Открыть</a></p>`,
    });
  }
}
