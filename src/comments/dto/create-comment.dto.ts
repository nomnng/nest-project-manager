import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateCommentDto {
	@MinLength(1, { message: "Comment content must not be empty" })
	@IsString({ message: "Comment content must be a string" })
	@IsNotEmpty({ message: "Comment content is required" })
	content: string;
}
