import { ApiProperty } from "@nestjs/swagger";
import { MinLength, IsNotEmpty, IsString } from "class-validator";

export class CreateProjectDto {
	@ApiProperty({
		example: "Website Redesign",
		description: "The name of the project (min 3 characters).",
	})
	@MinLength(3, { message: "Project name must be at least 3 characters long" })
	@IsString({ message: "Project name must be a string" })
	@IsNotEmpty({ message: "Project name is required" })
	name: string;
}
