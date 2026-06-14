import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { User } from "../users/user.schema";

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Project {
	@Prop({ required: true })
	name: string;

	@Prop({ type: Types.ObjectId, ref: User.name, required: true })
	ownerId: Types.ObjectId;

	@Prop({ type: [{ type: Types.ObjectId, ref: User.name }], default: [] })
	memberIds: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
