import {Injectable} from '@nestjs/common';
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {UpdateEtatDto} from "./dto/Attendance.dto";
import { Attendance, AttendanceStatus, Etat } from './Schema/Attendance.schema';
import { User } from 'src/auth/Shemas/User.shema';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AttendanceService {
    constructor(@InjectModel(Attendance.name) private attendanceModel: Model<Attendance>, @InjectModel(User.name) private userModel: Model<User> , private readonly authService : AuthService,private readonly personnelservice:AuthService) {
    }

    async generateAttendanceTableForWeek1(): Promise<void> {
        const personnelList = await this.userModel.find().exec();

        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (today.getDay() - 1)); // Start from Monday
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6); // End on Sunday

        for (const personnel of personnelList) {
            const attendances = [];
            for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
                const attendance = new this.attendanceModel({
                    date: currentDate,
                    etat: Etat.pending,
                    status: AttendanceStatus.Absent,
                });
                // Save the attendance
                await attendance.save();
                attendances.push(attendance); // Store the ID in the array
            }
            personnel.attendances = attendances;
            await personnel.save();
            //console.log(personnel.attendances)
        }
    }
    async getNotApprovedAttendances(personnelId: string): Promise<Attendance[]> {
        try {
            const attendanceList = await this.personnelservice.getAttendaces(personnelId);
            console.log(attendanceList);

            if (!attendanceList) {
                console.log('Impossible de récupérer la liste des présences.');
                return [];
            }

            console.log("après if");
            const notApprovedAttendances = attendanceList.filter(attendance => attendance.etat === Etat.pending);
            return notApprovedAttendances;
        } catch (error) {
            console.log('Une erreur s\'est produite lors de la récupération de la liste des présences :', error);
            return [];
        }
    }
    async getApprovedAttendances(personnelId: string): Promise<Attendance[]> {
        try {
            const attendanceList = await this.authService.getAttendaces(personnelId);
            console.log(attendanceList);

            if (!attendanceList) {
                console.log('Impossible de récupérer la liste des présences.');
                return [];
            }

            console.log("après if");
            const ApprovedAttendances = attendanceList.filter(attendance => attendance.etat !== Etat.pending);
            return ApprovedAttendances;
        } catch (error) {
            console.log('Une erreur s\'est produite lors de la récupération de la liste des présences :', error);
            return [];
        }
    }
    async validatePresence(personnelId: string, attend: UpdateEtatDto[]): Promise<void> {
        console.log(attend);
        const attendanceList = await this.getNotApprovedAttendances(personnelId);
        if (!attendanceList) {
            console.log('Impossible de récupérer la liste des présences.');
            return;
        }
        if (!Array.isArray(attend)) {
            console.log('attend doit être un tableau');
            return;
        }
        console.log(attendanceList);
        for (const attendance of attendanceList) {
            for (const att of attend) {
                const attendanceDate = new Date(attendance.date).setHours(0, 0, 0, 0);
                const attDate = new Date(att.date).setHours(0, 0, 0, 0);
                if (attendanceDate === attDate) {
                    attendance.etat = att.etat;
                    console.log(attendance.status);
                    // Mettre à jour l'objet de présence
                    await attendance.save();
                    console.log(attendance);
                }
            }
        }
    }
    async calculateAttendanceDays(personalId:string): Promise<object> {
        let presentDays = 0;
        let absentDays = 0;
        let attendanceList =  await this.getApprovedAttendances(personalId);
        for (const attendance of attendanceList) {
            console.log(attendanceList)
            if (attendance.status === 1 || attendance.status === 0.5 || attendance.status === 0.5) {
                presentDays += attendance.status;
            } else {
                absentDays +=1;
            }
            if (attendance.etat===Etat.declined){
                absentDays+=1;
            }
        }
        return { presentDays, absentDays };
    }
}
