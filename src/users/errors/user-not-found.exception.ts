import { NotFoundException } from "@nestjs/common";
import { UserErrorCodes } from "./user-errors.enum";

export class UserNotFoundException extends NotFoundException {
	constructor(userId: string) {
		super({
			errorCode: UserErrorCodes.NOT_FOUND,
			message: `User with id '${userId}' not found.`,
		});
	}
}
