import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ApiOperation } from "@nestjs/swagger";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	@ApiOperation({ summary: "Register a new user account" })
	register(@Body() registerDto: RegisterDto) {
		return this.authService.register(registerDto);
	}

	@Post("login")
	@ApiOperation({
		summary: "Authenticate an existing user and return an access token",
	})
	@HttpCode(HttpStatus.OK)
	login(@Body() loginDto: LoginDto) {
		return this.authService.login(loginDto);
	}
}
