import { NotFoundException } from "@nestjs/common";
import { TaskErrorCodes } from "./task-errors.enum";

export class TaskNotFoundException extends NotFoundException {
	constructor(taskId: string) {
		super({
			errorCode: TaskErrorCodes.NOT_FOUND,
			message: `Task with ID '${taskId}' was not found.`,
		});
	}
}
