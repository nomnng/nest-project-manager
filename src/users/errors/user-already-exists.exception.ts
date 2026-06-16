import { BadRequestException } from "@nestjs/common";
import { UserErrorCodes } from "./user-errors.enum";

export class UserAlreadyExistsException extends BadRequestException {
	constructor(email: string) {
		super({
			errorCode: UserErrorCodes.ALREADY_EXISTS,
			message: `User with email '${email}' already exists.`,
		});
	}
}
