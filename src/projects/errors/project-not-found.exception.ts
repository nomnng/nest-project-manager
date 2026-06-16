import { NotFoundException } from "@nestjs/common";
import { ProjectErrorCodes } from "./project-errors.enum";

export class ProjectNotFoundException extends NotFoundException {
	constructor(projectId: string) {
		super({
			errorCode: ProjectErrorCodes.NOT_FOUND,
			message: `Project with ID '${projectId}' was not found.`,
		});
	}
}
