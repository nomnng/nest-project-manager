import { UnauthorizedException } from "@nestjs/common";
import { AuthErrorCodes } from "./auth-errors.enum";

export class InvalidCredentialsException extends UnauthorizedException {
	constructor() {
		super({
			errorCode: AuthErrorCodes.INVALID_CREDENTIALS,
			message: "Invalid email or password",
		});
	}
}
