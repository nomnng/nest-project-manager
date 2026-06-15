import {
	IsArray,
	IsDateString,
	IsEnum,
	IsMongoId,
	IsOptional,
	IsString,
	MinLength,
} from "class-validator";
import { TaskStatus } from "../task-status.enum";

export class UpdateTaskDto {
	@IsOptional()
	@MinLength(3, { message: "Task name must be at least 3 characters long" })
	@IsString({ message: "Task name must be a string" })
	name?: string;

	@IsOptional()
	@IsEnum(TaskStatus, {
		message: "Status must be a valid TaskStatus enum value",
	})
	status?: TaskStatus;

	@IsOptional()
	@IsArray({ message: "Tags must be an array" })
	@IsString({ each: true, message: "Each tag must be a string" })
	tags?: string[];

	@IsOptional()
	@IsDateString({}, { message: "Deadline must be a valid date" })
	deadline?: Date;

	@IsOptional()
	@IsString({ message: "Description must be a string" })
	description?: string;

	@IsOptional()
	@IsMongoId({ message: "Parent task must be a valid MongoDB ObjectId" })
	parentTask?: string;
}
