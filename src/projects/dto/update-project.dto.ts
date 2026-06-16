import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsOptional, IsString } from "class-validator";

export class UpdateProjectDto {
	@ApiProperty({
		example: "Website Redesign",
		description: "The new name for the project.",
		required: false,
	})
	@IsOptional()
	@IsString({ message: "Project name must be a string" })
	name?: string;

	@ApiProperty({
		example: ["64bca1ff927e7e8f239c4b61", "64bd2ff928e7e8f123c4b77"],
		description: "Array of member user IDs to update for the project.",
		required: false,
		type: [String],
	})
	@IsOptional()
	@IsArray({ message: "memberIds must be an array" })
	@IsString({ each: true, message: "Each memberId must be a string" })
	memberIds?: string[];
}
