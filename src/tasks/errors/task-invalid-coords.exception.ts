import { BadRequestException } from "@nestjs/common";
import { TaskErrorCodes } from "./task-errors.enum";

export class TaskInvalidCoordsException extends BadRequestException {
	constructor(longitude?: number, latitude?: number) {
		super({
			errorCode: TaskErrorCodes.INVALID_COORDS,
			message: `Both longitude(${longitude}) and latitude(${latitude}) must be present.`,
		});
	}
}
