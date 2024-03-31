import { Prop, Schema, SchemaFactory  } from "@nestjs/mongoose";
import mongoose from "mongoose";

import { User } from "src/auth/Shemas/User.shema";
;


@Schema()
export  class Teams{
    @Prop({required:true})
    TeamsName:string;
    @Prop()
 
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: ()=>User }] })
    Employees:User[]; 



}
export const TeamsSchema= SchemaFactory.createForClass(Teams)