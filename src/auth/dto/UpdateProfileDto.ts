// update-profile.dto.ts
import { IsString, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  ProfileImage:string;
}