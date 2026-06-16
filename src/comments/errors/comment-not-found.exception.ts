import { NotFoundException } from "@nestjs/common";
import { CommentErrorCodes } from "./comment-errors.enum";

export class CommentNotFoundException extends NotFoundException {
	constructor(commentId: string) {
		super({
			code: CommentErrorCodes.NOT_FOUND,
			message: `Comment with id ${commentId} not found`,
		});
	}
}
