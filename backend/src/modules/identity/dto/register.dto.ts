import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString({ message: 'Пароль обязателен' })
  @MinLength(8, { message: 'Пароль должен быть не короче 8 символов' })
  @MaxLength(128, { message: 'Пароль слишком длинный' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Пароль должен содержать заглавную, строчную букву и цифру',
  })
  password!: string;

  @IsString({ message: 'Имя обязательно' })
  @MinLength(2, { message: 'Имя должно быть не короче 2 символов' })
  @MaxLength(80, { message: 'Имя слишком длинное' })
  name!: string;
}
