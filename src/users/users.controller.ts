import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { AuthGuard } from "src/auth/auth.guard";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";

@Controller("users")
@ApiBearerAuth("JWT-auth")
@UseGuards(AuthGuard)
export class UsersController {
	constructor(private usersService: UsersService) {}

	@Get("me")
	@ApiOperation({ summary: "Get the current authenticated user's information" })
	async getCurrentUser(@Req() req) {
		const userId = req.user.id;
		const user = await this.usersService.findOne(userId);
		return {
			id: userId,
			email: user.email,
		};
	}
}
