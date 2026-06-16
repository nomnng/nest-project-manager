import {
	IsArray,
	IsDateString,
	IsEnum,
	IsMongoId,
	IsOptional,
	IsString,
	MinLength,
	ValidateNested,
} from "class-validator";
import { TaskStatus } from "../task-status.enum";
import { LocationDto } from "./location.dto";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateTaskDto {
	@ApiProperty({
		example: "Design landing page",
		description: "The new name for the task (min 3 characters).",
		required: false,
	})
	@IsOptional()
	@MinLength(3, { message: "Task name must be at least 3 characters long" })
	@IsString({ message: "Task name must be a string" })
	name?: string;

	@ApiProperty({
		example: TaskStatus.IN_PROGRESS,
		description: "The new status of the task.",
		required: false,
		enum: TaskStatus,
	})
	@IsOptional()
	@IsEnum(TaskStatus, {
		message: "Status must be a valid TaskStatus enum value",
	})
	status?: TaskStatus;

	@ApiProperty({
		example: ["UX", "frontend"],
		description: "Tags to update on the task.",
		required: false,
		type: [String],
	})
	@IsOptional()
	@IsArray({ message: "Tags must be an array" })
	@IsString({ each: true, message: "Each tag must be a string" })
	tags?: string[];

	@ApiProperty({
		example: "2024-07-15T23:59:59.000Z",
		description: "New deadline in ISO 8601 format.",
		required: false,
	})
	@IsOptional()
	@IsDateString({}, { message: "Deadline must be a valid date" })
	deadline?: Date;

	@ApiProperty({
		example: "Update landing page with new branding.",
		description: "A new detailed description for the task.",
		required: false,
	})
	@IsOptional()
	@IsString({ message: "Description must be a string" })
	description?: string;

	@ApiProperty({
		example: "64bca1ff927e7e8f239c4b61",
		description: "The ObjectId of the new parent task",
		required: false,
	})
	@IsOptional()
	@IsMongoId({ message: "Parent task must be a valid MongoDB ObjectId" })
	parentTask?: string;

	@ApiProperty({
		type: () => LocationDto,
		description: "The new geographical location relevant to this task.",
		example: {
			type: "Point",
			coordinates: [35.6895, 139.6917],
		},
		required: false,
	})
	@IsOptional()
	@ValidateNested({ message: "Location object is invalid" })
	@Type(() => LocationDto)
	location?: LocationDto;
}
