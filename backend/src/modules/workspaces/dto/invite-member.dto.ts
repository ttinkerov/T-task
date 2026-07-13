import { WorkspaceRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}
