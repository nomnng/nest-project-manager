import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateCommentDto {
	@ApiProperty({
		example: "This is a great update!",
		description: "Content of the comment (at least 1 character).",
	})
	@MinLength(1, { message: "Comment content must not be empty" })
	@IsString({ message: "Comment content must be a string" })
	@IsNotEmpty({ message: "Comment content is required" })
	content: string;
}
