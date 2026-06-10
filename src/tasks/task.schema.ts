import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Task {
	@Prop({ required: true })
	name: string;

	@Prop({ required: true })
	projectId: string;

	@Prop({ type: [String], default: [] })
	tags: string[];

	@Prop({ required: false })
	deadline?: Date;

	@Prop({ required: false })
	description?: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
