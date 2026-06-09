import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Project {
	@Prop({ required: true })
	name: string;

	@Prop({ required: true })
	ownerId: string;

	@Prop({ required: false })
	memberIds: string[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
