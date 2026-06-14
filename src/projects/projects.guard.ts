import {
	Injectable,
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	NotFoundException,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";

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
			throw new NotFoundException("Project not found");
		}

		const isOwner = project.ownerId.toString() === userId;
		const isMember = project.memberIds?.some((id) => id.toString() === userId);

		if (!isOwner && !isMember) {
			throw new ForbiddenException("You do not have access to this project");
		}

		request.project = project;

		return true;
	}
}
