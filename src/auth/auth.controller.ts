import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req, Res, UnauthorizedException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { signupDto } from './dto/signupDto';
import { loginDto } from './dto/login.dto';
import { User } from './Shemas/User.shema';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './dto/UpdateProfileDto';
import { UpdatePasswordDto } from './dto/UpdatePasswordDto';
import { ForgotPasswordDto } from './dto/ForgotPasswordDto';
import { ResetPasswordDto } from './dto/ResetPasswordDto';
import { Role } from './Shemas/Roles.Shema';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Controller('auth')
export class AuthController {
    constructor(private authservice:AuthService){}

  @Post('signup')
    async signUp(@Body() signupDto: signupDto): Promise<{ token: string }> {
    return await this.authservice.signUp(signupDto);
  }
  @Post('/login')
  async login(@Body() logindto: loginDto): Promise<{ token: string; expiresIn: number; user: { role: Role; id: string; firstname: string  , lastname : string} }> {
    return this.authservice.login(logindto);
  }


  @Get('/findrole')
  async findWithRole(@Body('id') id: string): Promise<User> {
    return this.authservice.findByIdWithRole(id);
  }


  @Post('/activate')
  // @Roles('admin')
  // @UseGuards(RolesGuard)
  async activateUser(@Body('userId') userId: string): Promise<User> {
    try {
      const user = await this.authservice.activateUser(userId);
      return user;
    } catch (error) {
      throw new Error("Une erreur s'est produite lors de l'activation de l'utilisateur.");
    }
  }
  @Post('/deactivate')
  // @Roles('admin')
  // @UseGuards(RolesGuard)
  async deactivateUser(@Body('userId') userId:string):Promise<User>{
    try{
      const user=await this.authservice.deactivateUser(userId);
      return user;
    }
    catch(error){
      throw new Error("une erreur s' est produite lors de la deseactivation de compte")
    }
  }
  @Post('/logout')
  @UseGuards(AuthGuard())
  async logout(@Res({ passthrough: true }) res: Response): Promise<void> {
    console.log(res.cookie);
    res.clearCookie('user_token');
  }

  @Patch('/update-profile')
  @UseGuards(AuthGuard())
  async updateProfile(@Req() req: Request, @Body() updateDto: UpdateProfileDto): Promise<User> {
    const { user } = req as any;
    const updatedUser = await this.authservice.updateUser(user.id, updateDto);
    return updatedUser;
  }
  @Patch('/update-password')
  @UseGuards(AuthGuard())
  async updatePassword(@Req() req: Request, @Body() updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { user } = req as any;
    await this.authservice.updatePassword(user.id, updatePasswordDto);
  }

  @Post('/forgot-password')
  // @UseGuards(AuthGuard())
  async forgotPassword(@Body('email') email : string): Promise<void> {
    // const token = request.headers['authorization'].split(' ')[1];
  
    await this.authservice.sendPinCode(email);
  }
  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { newPassword, pinCode } = resetPasswordDto;
    await this.authservice.resetPassword(newPassword, pinCode);
  }

  @Get('isemailvalid')
  async  isEmailValid(@Body('email') email:string):Promise<boolean>
  {
    return this.isEmailValid(email);
  }
  @Get('allusers')
  async getAllUsers(): Promise<User[]> {
    return this.authservice.getAllUsers();
  }
  @Get('userbytoken')
  @UseGuards(AuthGuard())
  async getUserByToken(@Req() request: Request): Promise<User> {
    const token = request.headers['authorization'].split(' ')[1];
    const user = await this.authservice.getUserByToken(token);
    return user;
  }
  @Get('/allusers')
  async getuserbyid(): Promise<User[]>{
    return await this.authservice.getusers1();
  }
  
  @Post('uploadImage')
  @UseInterceptors(FileInterceptor('file' , {storage : diskStorage({
    destination : './uploads',
    filename : (req , file , cb)=>{
      const name = file.originalname.split('.')[0];
      const fileExtension = file.originalname.split('.')[1];
      const newFileName = name.split("").join('-') + '-' + Date.now() + '.' + fileExtension;
      cb(null , newFileName); 
    }
  }),
  fileFilter :(req, file , cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(null , false);
    }
    cb(null, true);
  }
}))
  uploadPhoto(@UploadedFile() file : Express.Multer.File) {
    if(!file){
      throw new BadRequestException('File not found');
      }else{
        const response = {
          filePath : 'http://localhost:3000/posts/pictures/' + file.filename
        };
        return response ;
      };
    }

@Get('pictures/:filename') 
async getPicture(@Param ('filename') filename , @Res() res){
  res.sendFile(filename , {root : './uploads'});
}


}


