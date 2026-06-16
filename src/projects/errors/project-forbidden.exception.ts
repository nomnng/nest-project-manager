import { ForbiddenException } from "@nestjs/common";
import { ProjectErrorCodes } from "./project-errors.enum";

export class ProjectForbiddenException extends ForbiddenException {
	constructor(projectId: string) {
		super({
			errorCode: ProjectErrorCodes.FORBIDDEN,
			message: `You do not have permission to access project with ID '${projectId}'.`,
		});
	}
}
