import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class RegisterDto {
	@ApiProperty({
		example: "user@example.com",
		description: "The user's email address.",
	})
	@IsEmail({}, { message: "Incorrect email format" })
	@IsNotEmpty({ message: "Email is required" })
	email: string;

	@ApiProperty({
		example: "password123",
		description: "The user's account password (minimum 6 characters).",
	})
	@MinLength(6, { message: "Password must be at least 6 characters long" })
	@IsNotEmpty({ message: "Password is required" })
	password: string;
}
