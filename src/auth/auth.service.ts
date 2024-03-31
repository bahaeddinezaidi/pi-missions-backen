import {
    BadRequestException,
    Body,
    HttpException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    Res,
    UnauthorizedException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './Shemas/User.shema';
import { Model } from 'mongoose';
import * as bcrypt from  'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { signupDto } from './dto/signupDto';
import { loginDto } from './dto/login.dto';
import { MailerService } from './Mail.service';
import { UpdateProfileDto } from './dto/UpdateProfileDto';
import { UpdatePasswordDto } from './dto/UpdatePasswordDto';
import * as jwt from 'jsonwebtoken';
import { Roleservice } from './Role.service';
import {Attendance} from "../attendance/Schema/Attendance.schema";
import {UpdateAttendanceDto} from "../attendance/dto/Attendance.dto";
import { Role } from './Shemas/Roles.Shema';

@Injectable()
export class AuthService {
    constructor( 
        @InjectModel(User.name)
        private userMosel:Model<User>,
        private jwtservice:JwtService,
        private mailerService: MailerService,
        private readonly roleS : Roleservice,
        @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>
    ){}
   
    async signUp(signupDto: signupDto): Promise<{ token: string }> {
      const { firstName, lastName , email, password, roleName , EmailSecondaire , TelSecondaire , dateEntree , Tel , Matricule  , soldeConges , soldeMaladie , fonction} = signupDto;
      const hashedPassword = await bcrypt.hash(password, 10);
      const role = await this.roleS.findRoleByName(roleName); 
      const savedRole= await role.save()
      const user = new this.userMosel({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role ,// Assurez-vous que votre modèle User peut stocker une référence au rôle
        EmailSecondaire,
        TelSecondaire ,
        dateEntree ,
        Tel,
        Matricule ,
        soldeConges ,
        soldeMaladie ,
        fonction
      });
      await user.save();
      await this.userMosel.updateOne({_id : user._id},{$push: {role : savedRole.name}});
      // Générez le token ici, selon votre logique d'authentification
      const token = this.jwtservice.sign({ id: user._id , role : role.name});;

    const welcomeMessage = `Votre compte a été créé avec succès. Voici votre mot de passe : ${password}`;
    await this.mailerService.sendEmail(email, 'Bienvenue sur notre plateforme', welcomeMessage)
      return { token };
    }

    async getusers1(): Promise<User[]>{
      return  await this.userMosel.find().populate('role');
    }
    async login(logindto: loginDto): Promise<{ token: string; expiresIn: number; user: { role: Role; id: string; firstname: string  , lastname : string} }> {
      const { email, password } = logindto;

      const user = await this.userMosel.findOne({ email });
      if (!user) {
        throw new UnauthorizedException('Invalid Email or Password !!!');
      }
      const isPasswordMatched = await bcrypt.compare(password, user.password);
      if (!isPasswordMatched) {
        throw new UnauthorizedException('Invalid Email or Password !!!');
      }
      if (!user.isActive) {
        throw new HttpException('Votre compte n\'est pas activé par l\'administrateur', 400);
      }
      const token = this.jwtservice.sign({ id: user.id, role: user.role, firstname: user.firstName , lastname : user.lastName });
      const expiresIn = 3600;

      const userData = {
        role: user.role,
        id: user.id,
        firstname: user.firstName ,
        lastname : user.lastName
      };

      return { token, expiresIn, user: userData };
    }

async findByIdWithRole(id: string): Promise<User> {
  
  let test =  await this.userMosel.findById(id).populate('role');
  console.log(test);
  return test ;
  }

async activateUser(userId: string): Promise<User> {
  const user = await this.userMosel.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true },
  );
  
    if (user) {
      const activationMessage =
        'Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter à notre plateforme.';
      await this.mailerService.sendEmail(
        user.email,
        'Activation de votre compte',
        activationMessage,
      );
    }
  
    return user;
  }
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.userMosel.findByIdAndUpdate(
        userId,
        { isActive: false },
        { new: true },
    );

    if (user) {
        const deactivationMessage =
            'Votre compte a été désactivé par l admin. Si vous avez des questions, veuillez nous contacter.';
        await this.mailerService.sendEmail(
            user.email,
            'Désactivation de votre compte',
            deactivationMessage,
        );
    }

    return user;
}

  async updateUser(userId: string, updateDto: UpdateProfileDto): Promise<User> {
    const { name, email } = updateDto;

    const updatedUser = await this.userMosel.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true },
    );

    return updatedUser;
  }
  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const { oldPassword, newPassword } = updatePasswordDto;

    const user = await this.userMosel.findById(userId);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Le mot de passe actuel est incorrect.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
  }

  async sendPinCode(email : string ): Promise<void> {
    // const decodedToken :any = jwt.verify(token,'bahazaidi'); 
    // const userId = decodedToken.id;
  
    // const user = await this.userMosel.findById(userId);
  
    // if (!user) {
    //   throw new NotFoundException('Utilisateur non trouvé');
    // }ch
    if(this.checkifemailvalid(email)){
      let user = await this.userMosel.findOne({ email });
  
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString(); 
    user.pinCode = pinCode;
    await user.save();
   

 
  
    await this.mailerService.sendEmail(
     email,
      'Code PIN de réinitialisation du mot de passe',
      `Votre code PIN de réinitialisation du mot de passe est : ${pinCode}`,
    );
  }
  else {
    throw new BadRequestException('Email invalide');
  }
  }
  async resetPassword(newPassword: string, pinCode: string): Promise<void> {
    const user = await this.userMosel.findOne({ pinCode });

    if (!user) {
      throw new BadRequestException('Code PIN invalide');
    }

    user.password = newPassword;
    user.pinCode = null;
    await user.save();
  }
//  async checkifadmin(token:string):Promise<boolean>{
//   const decodedToken: any = jwt.verify(token, 'bahazaidi'); 
//   const userId = decodedToken.id;
//   const user = await this.findByIdWithRole(userId);
//   const userRoles = user.role.map(role => role.name);
//   return userRoles.includes('admin');

//  }
 async checkifemailvalid(email:string):Promise<boolean>{
  const user=await this.userMosel.findOne({email});
  if(!user){return false;}
  return true;
 }
 async getAllUsers(): Promise<User[]> {
  return this.userMosel.find().exec();
}
 async getUserByToken(token:string):Promise<User>{
  const decodedToken:any =jwt.verify(token,'bahazaidi') ;
  const user = await this.userMosel.findOne({ _id:decodedToken.id })
  return user;
 }
 

    async getSoldesConges(id : string): Promise<number>{
        try {
            const personnel = await this.userMosel.findById(id);
            if (!personnel){
                throw new NotFoundException('personnel introuvable')
            }
            return personnel.soldeConges ;
        }catch (error){
            throw new InternalServerErrorException('Erreur lors de la récuperation du solde de congés')
        }
    }

    async getPersonnelWithAttendances(idP : string): Promise<User> {
        const personnel = this.userMosel.findById(idP).populate(['attendances']);
        if (!personnel) {
            throw new NotFoundException('personnel not found');
        }
        return personnel ;
    }
    async getAttendaces(idp: string): Promise<Attendance[]> {
        const personnel = await this.userMosel.findById(idp).populate(['attendances']);
        return personnel.attendances;
    }
    async updateAttendanceList(personnelId: string, attend: UpdateAttendanceDto[]): Promise<void> {
        console.log(attend);
        const attendanceList = await this.getAttendaces(personnelId);
        if (!attendanceList) {
            console.log('Impossible de récupérer la liste des présences.');
            return;
        }
        console.log(attendanceList);
        for (const attendance of attendanceList) {
            for (const att of attend) {
                const attendanceDate = new Date(attendance.date).setHours(0, 0, 0, 0);
                const attDate = new Date(att.date).setHours(0, 0, 0, 0);
                if (attendanceDate === attDate) {
                    attendance.status = att.status;
                    console.log(attendance.status);
                    // Mettre à jour l'objet de présence
                    await attendance.save();
                    console.log(attendance);
                }
            }
        }
    }
    getUserById(id:string){
      return this.userMosel.findById(id)
  }
  async findUserByTaskId(taskId: string): Promise<User> {
    const user = await this.userMosel.findOne({ tasks: taskId }).exec();
    if (!user) {
      throw new NotFoundException('User with the given task ID not found');
    }
    return user;
  }
   async verifyJwt(jwt: string): Promise<any> {
    return this.jwtservice.verifyAsync(jwt);
  }
  
}
