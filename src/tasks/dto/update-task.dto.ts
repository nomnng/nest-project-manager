import { TaskStatus } from "../task-status.enum";

export class UpdateTaskDto {
	name?: string;
	status?: TaskStatus;
	tags?: string[];
	deadline?: Date;
	description?: string;
}
