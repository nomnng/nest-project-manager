import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateCommentDto {
	@IsOptional()
	@MinLength(1, { message: "Comment content must not be empty" })
	@IsString({ message: "Comment content must be a string" })
	content?: string;
}
