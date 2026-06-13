import { IsArray, IsOptional, IsString } from "class-validator";

export class UpdateProjectDto {
	@IsOptional()
	@IsString({ message: "Project name must be a string" })
	name?: string;

	@IsOptional()
	@IsArray({ message: "memberIds must be an array" })
	@IsString({ each: true, message: "Each memberId must be a string" })
	memberIds?: string[];
}
