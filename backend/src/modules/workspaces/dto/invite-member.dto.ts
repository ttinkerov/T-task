import { WorkspaceRole } from '@prisma/client';
import { IsBoolean, IsEmail, IsEnum, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsOptional()
  @IsEnum(WorkspaceRole, { message: 'Некорректная роль' })
  role?: WorkspaceRole;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
