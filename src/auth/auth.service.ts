import { Injectable, UnauthorizedException } from "@nestjs/common";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { UsersService } from "../users/users.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { InvalidCredentialsException } from "./errors/invalid-credentials.exception";

@Injectable()
export class AuthService {
	constructor(
		private usersService: UsersService,
		private jwtService: JwtService,
	) {}

	async register(registerDto: RegisterDto) {
		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(registerDto.password, salt);

		await this.usersService.create(registerDto.email, passwordHash);
		return {
			message: "Registration successful",
		};
	}

	async login(loginDto: LoginDto) {
		const user = await this.usersService.findOneByEmail(loginDto.email);
		if (!user) {
			throw new InvalidCredentialsException();
		}

		const isPasswordValid = await bcrypt.compare(
			loginDto.password,
			user.passwordHash,
		);

		if (!isPasswordValid) {
			throw new InvalidCredentialsException();
		}

		const payload = { id: user.id };
		const jwt = await this.jwtService.signAsync(payload);
		return {
			jwt,
		};
	}
}
