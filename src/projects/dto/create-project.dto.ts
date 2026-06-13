import { MinLength, IsNotEmpty, IsString } from "class-validator";

export class CreateProjectDto {
	@MinLength(3, { message: "Project name must be at least 3 characters long" })
	@IsString({ message: "Project name must be a string" })
	@IsNotEmpty({ message: "Project name is required" })
	name: string;
}
