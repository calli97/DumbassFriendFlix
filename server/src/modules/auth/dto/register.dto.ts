import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

// Registration is always for regular users — role assignment is not exposed here
export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
