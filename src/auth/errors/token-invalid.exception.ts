import { UnauthorizedException } from "@nestjs/common";
import { AuthErrorCodes } from "./auth-errors.enum";

export class TokenInvalidException extends UnauthorizedException {
	constructor() {
		super({
			errorCode: AuthErrorCodes.TOKEN_INVALID,
			message: "Access token is invalid or corrupted",
		});
	}
}
