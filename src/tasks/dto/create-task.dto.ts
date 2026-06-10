import { TaskStatus } from "../task-status.enum";

export class CreateTaskDto {
	name: string;
	status?: TaskStatus;
	tags?: string[];
	deadline?: Date;
	description?: string;
}
