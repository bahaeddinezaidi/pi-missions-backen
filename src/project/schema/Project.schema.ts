import { Prop, Schema, SchemaFactory  } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { Tasks } from "./Tasks.schema";



@Schema()
export  class Project {
@Prop({required:true})
NomProject:string;
@Prop()
description:string;
@Prop()
StartDate?:string;
@Prop()
FinishDate?:string;
@Prop()
 statut?:TypeStatutProjet;
 @Prop()
 projectUrl?: string;
@Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: ()=>Tasks }] })
tasks:Tasks []; 
@Prop()
 NomChefProjet?:string
@Prop()
priority?:ProjectPriority;
@Prop()
progress?:number
@Prop()
type?:ProjectType
}
export const ProjectSchema= SchemaFactory.createForClass(Project)
export enum TypeStatutProjet {
    NOUVEAU = 0,
    RUNNING = 1,
    FINISHED  = 3,
  }
  
  export enum TypeStatutTache {
    A_FAIRE = 'à faire',
    RUNNING = 'RUNNING',
    FINISHED  = 'FINISHED',
  }
  export enum ProjectPriority {
    LOW = -1,
    MEDIUM = 0,
    HIGH = 1,
  }
  export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
  }
  export enum ProjectType {
    WEB = 'Website',
    ANDROID = 'Android',
    IPHONE = 'IPhone',
    TESTING = 'Testing',
    otherType='other type'
  }