jest.mock("bcrypt", () => ({
	genSalt: jest.fn().mockResolvedValue("mocked-salt"),
	hash: jest.fn().mockResolvedValue("mocked-hash"),
	compare: jest.fn(),
}));

import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";

describe("AuthService", () => {
	let service: AuthService;
	let usersService: jest.Mocked<UsersService>;
	let jwtService: jest.Mocked<JwtService>;

	beforeEach(async () => {
		const mockUsersService = {
			create: jest.fn(),
			findOneByEmail: jest.fn(),
		};

		const mockJwtService = {
			signAsync: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersService, useValue: mockUsersService },
				{ provide: JwtService, useValue: mockJwtService },
			],
		}).compile();

		service = module.get<AuthService>(AuthService);
		usersService = module.get(UsersService);
		jwtService = module.get(JwtService);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("register", () => {
		it("should hash password and successfully register a user", async () => {
			const registerDto = {
				email: "test@example.com",
				password: "password123",
			};

			jest
				.spyOn(bcrypt, "genSalt")
				.mockImplementation(async () => "mocked-salt");
			jest.spyOn(bcrypt, "hash").mockImplementation(async () => "mocked-hash");

			const result = await service.register(registerDto);

			expect(bcrypt.genSalt).toHaveBeenCalled();
			expect(bcrypt.hash).toHaveBeenCalledWith("password123", "mocked-salt");

			expect(usersService.create).toHaveBeenCalledWith(
				"test@example.com",
				"mocked-hash",
			);

			expect(result).toEqual({ message: "Registration successful" });
		});
	});

	describe("login", () => {
		const loginDto = { email: "test@example.com", password: "password123" };
		const mockUser = {
			id: "user-uuid",
			email: "test@example.com",
			passwordHash: "hashed-pass",
		};

		it("should return a JWT token when credentials are valid", async () => {
			usersService.findOneByEmail.mockResolvedValue(mockUser);
			jest.spyOn(bcrypt, "compare").mockImplementation(async () => true);
			jwtService.signAsync.mockResolvedValue("mocked-jwt-token");

			const result = await service.login(loginDto);

			expect(usersService.findOneByEmail).toHaveBeenCalledWith(loginDto.email);
			expect(bcrypt.compare).toHaveBeenCalledWith(
				loginDto.password,
				mockUser.passwordHash,
			);
			expect(jwtService.signAsync).toHaveBeenCalledWith({ id: mockUser.id });
			expect(result).toEqual({ jwt: "mocked-jwt-token" });
		});

		it("should throw UnauthorizedException if user email is not found", async () => {
			usersService.findOneByEmail.mockRejectedValue(new Error("Not found"));

			await expect(service.login(loginDto)).rejects.toThrow(
				UnauthorizedException,
			);
			await expect(service.login(loginDto)).rejects.toThrow(
				"Invalid email or password",
			);
		});

		it("should throw UnauthorizedException if password check fails", async () => {
			usersService.findOneByEmail.mockResolvedValue(mockUser);
			jest.spyOn(bcrypt, "compare").mockImplementation(async () => false);

			await expect(service.login(loginDto)).rejects.toThrow(
				UnauthorizedException,
			);
		});
	});
});
