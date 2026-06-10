import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { ProjectsService } from "src/projects/projects.service";
import { TasksService } from "./tasks.service";

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
			throw new NotFoundException("Project not found");
		}

		const isOwner = project.ownerId === userId;
		const isMember = project.memberIds?.includes(userId);

		if (!isOwner && !isMember) {
			throw new ForbiddenException("You do not have access to this project");
		}

		if (!taskId) return true;

		const task = await this.tasksService.findOne(taskId);
		if (task?.projectId !== projectId) {
			throw new NotFoundException("Task not found");
		}

		request.task = task;

		return true;
	}
}
