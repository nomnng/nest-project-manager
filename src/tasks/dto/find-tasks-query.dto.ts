export const TASK_SORT_FIELDS = [
	"name",
	"status",
	"deadline",
	"createdAt",
] as const;

export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

export type SortOrder = "asc" | "desc";

export class FindTasksQueryDto {
	search?: string;
	sortBy?: TaskSortField;
	sortOrder?: SortOrder;
}
