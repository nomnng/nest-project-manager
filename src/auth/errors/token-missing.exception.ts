import { UnauthorizedException } from "@nestjs/common";
import { AuthErrorCodes } from "./auth-errors.enum";

export class TokenMissingException extends UnauthorizedException {
	constructor() {
		super({
			errorCode: AuthErrorCodes.TOKEN_MISSING,
			message: "Access token is missing from Authorization header",
		});
	}
}
