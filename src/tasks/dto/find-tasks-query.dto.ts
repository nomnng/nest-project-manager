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
	search?: string;

	@IsOptional()
	@IsIn([...TASK_SORT_FIELDS])
	sortBy?: TaskSortField;

	@IsOptional()
	@IsIn(["asc", "desc"])
	sortOrder?: SortOrder;

	@IsOptional()
	@Transform(({ value }) => Number(value))
	@IsNumber({}, { message: "Longitude must be a number" })
	longitude?: number;

	@IsOptional()
	@Transform(({ value }) => Number(value))
	@IsNumber({}, { message: "Latitude must be a number" })
	latitude?: number;
}
