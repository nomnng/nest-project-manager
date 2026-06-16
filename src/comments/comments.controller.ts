import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { AuthGuard } from "src/auth/auth.guard";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { CommentAccessGuard } from "./comments.guard";
import { CommentsService } from "./comments.service";

@Controller("projects/:projectId/tasks/:taskId/comments")
@ApiBearerAuth("JWT-auth")
@UseGuards(AuthGuard, CommentAccessGuard)
export class CommentsController {
	constructor(private readonly commentsService: CommentsService) {}

	@Get()
	@ApiOperation({ summary: "Get all comments for a specific task" })
	findAll(@Param("taskId") taskId: string) {
		return this.commentsService.findAll(taskId);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a specific comment by its id" })
	findOne(@Req() req) {
		return req.comment;
	}

	@Post()
	@ApiOperation({ summary: "Create a new comment for a specific task" })
	create(
		@Param("taskId") taskId: string,
		@Body() createCommentDto: CreateCommentDto,
		@Req() req,
	) {
		return this.commentsService.create(taskId, req.user.id, createCommentDto);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update an existing comment" })
	update(@Param("id") id: string, @Body() updateCommentDto: UpdateCommentDto) {
		return this.commentsService.update(id, updateCommentDto);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete a specific comment" })
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param("id") id: string) {
		return this.commentsService.remove(id);
	}
}
