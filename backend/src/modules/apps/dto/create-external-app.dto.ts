import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, Matches, MaxLength } from 'class-validator';

export class CreateExternalAppDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  // Reject ASCII controls and common BiDi / zero-width spoofing characters.
  // eslint-disable-next-line no-control-regex -- intentional control-character allowlist
  @Matches(/^[^\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\uFEFF]+$/, {
    message: 'Название не должно содержать невидимые или управляющие символы',
  })
  title!: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  url!: string;
}
