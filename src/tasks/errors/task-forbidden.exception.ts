import { ForbiddenException } from "@nestjs/common";
import { TaskErrorCodes } from "./task-errors.enum";

export class TaskForbiddenException extends ForbiddenException {
	constructor(taskId: string) {
		super({
			errorCode: TaskErrorCodes.FORBIDDEN,
			message: `You do not have permission to access task with ID '${taskId}'.`,
		});
	}
}
