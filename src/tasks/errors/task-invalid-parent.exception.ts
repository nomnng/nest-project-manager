import { BadRequestException } from "@nestjs/common";
import { TaskErrorCodes } from "./task-errors.enum";

export class TaskInvalidParentException extends BadRequestException {
	constructor(parentTaskId: string) {
		super({
			errorCode: TaskErrorCodes.INVALID_PARENT,
			message: `Task '${parentTaskId}' belongs to another project.`,
		});
	}
}
