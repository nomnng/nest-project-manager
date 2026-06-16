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
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectsService } from "./projects.service";
import { ProjectAccessGuard } from "./projects.guard";

@Controller("projects")
@ApiBearerAuth("JWT-auth")
@UseGuards(AuthGuard)
export class ProjectsController {
	constructor(private readonly projectsService: ProjectsService) {}

	@Get()
	@ApiOperation({ summary: "Get all projects that current user has access to" })
	findAll(@Req() req) {
		return this.projectsService.findAll(req.user.id);
	}

	@Get(":id")
	@ApiOperation({ summary: "Get a specific project by its id" })
	@UseGuards(ProjectAccessGuard)
	findOne(@Param("id") id: string, @Req() req) {
		return req.project;
	}

	@Post()
	@ApiOperation({ summary: "Create a new project" })
	create(@Body() createProjectDto: CreateProjectDto, @Req() req) {
		return this.projectsService.create(createProjectDto, req.user.id);
	}

	@Patch(":id")
	@ApiOperation({ summary: "Update an existing project" })
	@UseGuards(ProjectAccessGuard)
	update(
		@Param("id") id: string,
		@Body() updateProjectDto: UpdateProjectDto,
		@Req() req,
	) {
		return this.projectsService.update(req.project.id, updateProjectDto);
	}

	@Delete(":id")
	@ApiOperation({ summary: "Delete an existing project" })
	@HttpCode(HttpStatus.NO_CONTENT)
	@UseGuards(ProjectAccessGuard)
	remove(@Param("id") id: string, @Req() req) {
		return this.projectsService.remove(req.project.id);
	}

	@Get(":id/stats")
	@ApiOperation({
		summary:
			"Get statistics for a specific project, including status counts, overdue tasks, and popular tags",
	})
	@UseGuards(ProjectAccessGuard)
	calculateStats(@Param("id") id: string, @Req() req) {
		return this.projectsService.getProjectStats(id);
	}
}
