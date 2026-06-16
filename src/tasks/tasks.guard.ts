import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ProjectsService } from "src/projects/projects.service";
import { TasksService } from "./tasks.service";
import { ProjectNotFoundException } from "src/projects/errors/project-not-found.exception";
import { TaskNotFoundException } from "./errors/task-not-found.exception";
import { ProjectForbiddenException } from "src/projects/errors/project-forbidden.exception";

@Injectable()
export class TaskAccessGuard implements CanActivate {
	constructor(
		private readonly tasksService: TasksService,
		private readonly projectsService: ProjectsService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.id;
		const taskId = request.params.id;
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

		const task = await this.tasksService.findOne(taskId);
		if (task?.projectId?.toString() !== projectId) {
			throw new TaskNotFoundException(taskId);
		}

		request.task = task;

		return true;
	}
}
