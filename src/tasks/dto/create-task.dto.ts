import {
	IsArray,
	IsDateString,
	IsEnum,
	IsMongoId,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength,
	ValidateNested,
} from "class-validator";
import { TaskStatus } from "../task-status.enum";
import { LocationDto } from "./location.dto";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateTaskDto {
	@ApiProperty({
		example: "Design landing page",
		description: "The name of the task (min 3 characters).",
	})
	@MinLength(3, { message: "Task name must be at least 3 characters long" })
	@IsString({ message: "Task name must be a string" })
	@IsNotEmpty({ message: "Task name is required" })
	name: string;

	@ApiPropertyOptional({
		example: TaskStatus.TODO,
		description:
			"Status of the task. Allowed values: " +
			Object.values(TaskStatus).join(", "),
	})
	@IsOptional()
	@IsEnum(TaskStatus, {
		message: "Status must be a valid TaskStatus enum value",
	})
	status?: TaskStatus;

	@ApiPropertyOptional({
		example: ["UX", "frontend"],
		description: "Tags associated with the task, for filtering and searching.",
	})
	@IsOptional()
	@IsArray({ message: "Tags must be an array" })
	@IsString({ each: true, message: "Each tag must be a string" })
	tags?: string[];

	@ApiPropertyOptional({
		example: "2024-07-15T23:59:59.000Z",
		description: "Deadline for the task in ISO 8601 date string format.",
	})
	@IsOptional()
	@IsDateString({}, { message: "Deadline must be a valid date" })
	deadline?: Date;

	@ApiPropertyOptional({
		example:
			"Create initial version of the landing page with responsive design.",
		description: "A detailed description of the task.",
	})
	@IsOptional()
	@IsString({ message: "Description must be a string" })
	description?: string;

	@ApiPropertyOptional({
		example: "64bca1ff927e7e8f239c4b61",
		description: "The ObjectId of the parent task, if this is a subtask.",
	})
	@IsOptional()
	@IsMongoId({ message: "Parent task must be a valid MongoDB ObjectId" })
	parentTask?: string;

	@ApiPropertyOptional({
		type: () => LocationDto,
		description: "The geographical location relevant to this task.",
		example: {
			type: "Point",
			coordinates: [35.6895, 139.6917],
		},
	})
	@IsOptional()
	@ValidateNested({ message: "Location object is invalid" })
	@Type(() => LocationDto)
	location?: LocationDto;
}
