import { WorkspaceRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsOptional()
  @IsEnum(WorkspaceRole, { message: 'Некорректная роль' })
  role?: WorkspaceRole;
}
