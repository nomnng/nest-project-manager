import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { ProjectNotFoundException } from "./errors/project-not-found.exception";
import { ProjectForbiddenException } from "./errors/project-forbidden.exception";

@Injectable()
export class ProjectAccessGuard implements CanActivate {
	constructor(private readonly projectsService: ProjectsService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const userId = request.user?.id;
		const projectId = request.params.id;

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

		request.project = project;

		return true;
	}
}
