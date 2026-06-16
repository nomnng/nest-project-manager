import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateCommentDto {
	@ApiProperty({
		example: "This is an updated comment!",
		description: "The new content for the comment.",
		required: false,
	})
	@IsOptional()
	@MinLength(1, { message: "Comment content must not be empty" })
	@IsString({ message: "Comment content must be a string" })
	content?: string;
}
