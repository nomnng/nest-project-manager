import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";

export const TASK_SORT_FIELDS = [
	"name",
	"status",
	"deadline",
	"createdAt",
	"location",
] as const;

export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export type SortOrder = "asc" | "desc";

export class FindTasksQueryDto {
	@IsOptional()
	@IsString({ message: "Search must be a string" })
	@ApiProperty({
		description: "Search query to filter tasks by name or description.",
		example: "design",
		required: false,
	})
	search?: string;

	@IsOptional()
	@IsIn([...TASK_SORT_FIELDS])
	@ApiProperty({
		description: "Field to sort the tasks by.",
		example: "deadline",
		enum: TASK_SORT_FIELDS,
		required: false,
	})
	sortBy?: TaskSortField;

	@IsOptional()
	@IsIn(["asc", "desc"])
	@ApiProperty({
		description: "Order of sorting: ascending ('asc') or descending ('desc').",
		example: "asc",
		enum: ["asc", "desc"],
		required: false,
	})
	sortOrder?: SortOrder;

	@IsOptional()
	@Transform(({ value }) => Number(value))
	@IsNumber({}, { message: "Longitude must be a number" })
	@ApiProperty({
		description: "Longitude for location-based sorting.",
		example: 139.6917,
		required: false,
	})
	longitude?: number;

	@IsOptional()
	@Transform(({ value }) => Number(value))
	@IsNumber({}, { message: "Latitude must be a number" })
	@ApiProperty({
		description: "Latitude for location-based sorting.",
		example: 35.6895,
		required: false,
	})
	latitude?: number;
}
