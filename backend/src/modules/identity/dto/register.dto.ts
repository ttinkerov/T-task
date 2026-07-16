import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must include uppercase, lowercase, and a number',
  })
  password!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}
