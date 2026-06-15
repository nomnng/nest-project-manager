import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { Task } from "src/tasks/task.schema";
import { User } from "src/users/user.schema";

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Comment {
	_id: Types.ObjectId;

	@Prop({ required: true })
	content: string;

	@Prop({ type: Types.ObjectId, ref: Task.name, required: true })
	taskId: Types.ObjectId;

	@Prop({ type: Types.ObjectId, ref: User.name, required: true })
	authorId: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
