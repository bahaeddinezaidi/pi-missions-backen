import { IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { signupDto } from 'src/auth/dto/signupDto';
export class CreateTeamsDto{
    

    @IsNotEmpty()
   @IsString()
   name:string;

   @IsOptional()
   @ValidateNested()
  Employees: [signupDto]; 
    }