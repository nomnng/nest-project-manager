import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
	@ApiProperty({
		example: "user@example.com",
		description: "The user's email address.",
	})
	@IsString({ message: "Email must be a string" })
	@IsNotEmpty({ message: "Email is required" })
	email: string;

	@ApiProperty({
		example: "password123",
		description: "The user's account password.",
	})
	@IsString({ message: "Password must be a string" })
	@IsNotEmpty({ message: "Password is required" })
	password: string;
}
