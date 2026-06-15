import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { TaskStatus } from "./task-status.enum";
import { Project } from "src/projects/project.schema";

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Task {
	_id: Types.ObjectId;

	@Prop({ required: true })
	name: string;

	@Prop({ type: Types.ObjectId, ref: Project.name, required: true })
	projectId: Types.ObjectId;

	@Prop({
		type: String,
		enum: TaskStatus,
		default: TaskStatus.TODO,
	})
	status: TaskStatus;

	@Prop({ type: [String], default: [] })
	tags: string[];

	@Prop({ required: false })
	deadline?: Date;

	@Prop({ required: false })
	description?: string;

	@Prop({ type: Types.ObjectId, ref: Task.name, required: false })
	parentTask?: Types.ObjectId;

	@Prop({
		type: {
			type: String,
			enum: ["Point"],
			required: false,
		},
		coordinates: {
			type: [Number],
			required: false,
		},
		_id: false,
	})
	location?: {
		type: "Point";
		coordinates: [number, number];
	};
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index(
	{ name: "text", description: "text", tags: "text" },
	{ name: "task_text_search_index" },
);

TaskSchema.index({ location: "2dsphere" });
