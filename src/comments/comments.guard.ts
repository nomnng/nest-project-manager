import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ProjectsService } from "src/projects/projects.service";
import { Task, TaskDocument } from "src/tasks/task.schema";
import { CommentsService } from "./comments.service";
import { ProjectNotFoundException } from "src/projects/errors/project-not-found.exception";
import { ProjectForbiddenException } from "src/projects/errors/project-forbidden.exception";
import { TaskNotFoundException } from "src/tasks/errors/task-not-found.exception";
import { CommentNotFoundException } from "./errors/comment-not-found.exception";

@Injectable()
export class CommentAccessGuard implements CanActivate {
	constructor(
		private readonly commentsService: CommentsService,
		private readonly projectsService: ProjectsService,
		@InjectModel(Task.name)
		private readonly taskModel: Model<TaskDocument>,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.id;
		const commentId = request.params.id;
		const taskId = request.params.taskId;
		const projectId = request.params.projectId;

		if (!projectId) return true;

		const project = await this.projectsService.findOne(projectId);
		if (!project) {
			throw new ProjectNotFoundException(projectId);
		}

		const isOwner = project.ownerId.toString() === userId;
		const isMember = project.memberIds?.some((id) => id.toString() === userId);

		if (!isOwner && !isMember) {
			throw new ProjectForbiddenException(projectId);
		}

		if (!taskId) return true;

		const task = await this.taskModel.findById(taskId).exec();
		if (!task || task.projectId.toString() !== projectId) {
			throw new TaskNotFoundException(taskId);
		}

		request.task = task;

		if (!commentId) return true;

		const comment = await this.commentsService.findOne(commentId);
		if (comment.taskId.toString() !== taskId) {
			throw new CommentNotFoundException(commentId);
		}

		request.comment = comment;

		return true;
	}
}
