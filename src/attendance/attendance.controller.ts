import {Body, Controller, Get, HttpException, HttpStatus, Param, Post, Put} from '@nestjs/common';
import {AttendanceService} from "./attendance.service";
import {UpdateEtatDto} from "./dto/Attendance.dto";
import { Attendance } from './Schema/Attendance.schema';

@Controller('attendance')
export class AttendanceController {
    constructor(private readonly attendanceService: AttendanceService) {}

    @Post('/generateWeekly')
    async generateAttendanceTableForWeek(): Promise<void> {
        await this.attendanceService.generateAttendanceTableForWeek1();
    }

    // @Cron('0 0 1 * *') // Exécuter à minuit le premier jour de chaque mois
    // async generateAttendanceTableForMonth() {
    //     const currentYear = new Date().getFullYear();
    //     const currentMonth = new Date().getMonth();
    //     // Générer la table de présence pour chaque semaine du mois en cours
    //     for (let week = 1; week <= 5; week++) {
    //         const weekStartDate = new Date(currentYear, currentMonth, week * 7);
    //         await this.attendanceService.generateAttendanceTableForWeek1(weekStartDate);
    //     }
    // }
    @Get(':id/notApproved')
    async getNotApprovedAttendances(@Param('id') personnelId: string): Promise<Attendance[]> {
        return await this.attendanceService.getNotApprovedAttendances(personnelId);
    }

    @Put(':id/validate-presence')
    async validatePresence(@Param('id') personnelId: string , @Body() attend : UpdateEtatDto[]  ): Promise<void> {
        await this.attendanceService.validatePresence(personnelId , attend);
    }
    @Get('calculate/:personalId')
    async calculateAttendance(@Param('personalId') personalId: string) {
        try {
            const attendanceDays = await this.attendanceService.calculateAttendanceDays(personalId);
            return { attendanceDays };
        } catch (error) {
            throw new HttpException('Une erreur s\'est produite lors du calcul des jours de présence et d\'absence.', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
