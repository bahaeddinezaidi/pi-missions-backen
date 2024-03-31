import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateProjectDto, CreateTasksDto } from '../dto/CreateProject.dto';
import { Project } from '../schema/Project.schema';
import { Tasks } from '../schema/Tasks.schema';
import { User } from 'src/auth/Shemas/User.shema';
import { DateTime } from 'luxon';
import { CongeService } from 'src/conges/Conge.service';

@Injectable()
export class TaskService {
    constructor(@InjectModel(Tasks.name) private taskModel:Model<Tasks>,@InjectModel(Project.name) private projectModel:Model<Project>,
    @InjectModel(User.name) private userModel:Model<User>,private readonly congeservice:CongeService){}
    async createTask({projectId,...taskdto}:CreateTasksDto){
        const findProject= await this.projectModel.findById(projectId)
        if(!findProject) throw  new HttpException("project not found",400)
        const newTask=new this.taskModel(taskdto)
      const savedTask=await newTask.save()
    
      await this.projectModel.updateOne({_id:projectId},{$push:{tasks:savedTask._id}})
        return savedTask;
}
getTasks(){
    return this.taskModel.find();
}
getTaskById(id:string){
    return this.taskModel.findById(id).populate(['Project']);
}
updateTask(id:string,taskdto:CreateTasksDto){
  return  this.taskModel.findByIdAndUpdate(id,taskdto,{new:true})
}
async deleteTask(id: string) {
    // Delete the task by its ID and await to ensure it completes.
    const deletedTask = await this.taskModel.findByIdAndDelete(id);
    
    if (!deletedTask) {
      // Handle the case where the task does not exist.
      return null;
    }
  
    await this.projectModel.updateMany(
      {}, // This empty filter matches all documents in the collection.
      { $pull: { tasks: deletedTask._id } } // Pull the deleted task's ID from the tasks array.
    );
    
  
    return { message: 'Task deleted and references removed' };
  }
  async createTaskaffectedtoemployee({ employeeAffected, ...createTaskDto }: CreateTasksDto) {
    const newTask = new this.taskModel({
      ...createTaskDto,
      employeeAffected: employeeAffected// Affecter l'ID des paramètres à la propriété 'settings'
    });
  
    return newTask.save();
  }
  async createTask2({ projectId, employeeAffected, ...taskdto }: CreateTasksDto) {
    // Vérifiez si le projectId est fourni et que le projet existe
    if (projectId) {
      const findProject = await this.projectModel.findById(projectId);
      if (!findProject) throw new HttpException("Project not found", 400);
    }
    if (employeeAffected) {
      const findE= await this.userModel.findById(employeeAffected);
      if (!findE) throw new HttpException(" E not found", 400);
    }
  
    // Créez une nouvelle tâche avec les données fournies, y compris l'employé affecté si spécifié
    const newTask = new this.taskModel(
      taskdto
    );
  
    // Sauvegardez la tâche dans la base de données
    const savedTask = await newTask.save();
  
    // Si projectId est fourni, mettez à jour le projet avec l'ID de la nouvelle tâche
    if (projectId) {
      await this.projectModel.updateOne({ _id: projectId }, { $push: { tasks: savedTask._id } });
    }
    if (employeeAffected) {
      await this.userModel.updateOne({ _id:employeeAffected  }, {  $push: { tasks: savedTask._id}});
    }
  
    // Créez et envoyez une notification pour la nouvelle tâche

  
    // Retournez la tâche sauvegardée
    return savedTask;
  }
  async checkAndRemoveUserFromTask() {
    const users = await this.userModel.find();
    
    for (const user of users) {
      const tasks = await this.taskModel.find({ employeeAffected: user._id });
      
      for (const task of tasks) {   
        const finishDate = DateTime.fromFormat(task.FinishDate, 'dd/MM/yyyy').toJSDate();   

        if (task.FinishDate && finishDate <= new Date()) {

            task.User = null;
          await task.save();

        }
      }
    }
  }
  async isUserDisponible(employeeId: string, date: string): Promise<boolean> {
    const tasks = await this.taskModel.find({ employeeAffected: employeeId }).exec();
    let taskCount = 0;
    
    for (const task of tasks) {
        console.log(task.FinishDate + " - " + task.startDate+ " - " + date );
        const finishDate = new Date(task.FinishDate);
        const checkDate = new Date(date);
        console.log(finishDate + "###"+ checkDate);
        console.log(finishDate.getTime() +"###"+ checkDate.getTime());

        if (finishDate.getTime()>= checkDate.getTime()) {
          taskCount++;
      }
    }

    

    const hasLeave = await this.congeservice.ifLeave(date, employeeId);  
    return taskCount === 0 && !hasLeave;
}
}
