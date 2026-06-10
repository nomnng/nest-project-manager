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
	Query,
	Req,
	UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { AuthGuard } from "src/auth/auth.guard";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskAccessGuard } from "./tasks.guard";
import { TasksService } from "./tasks.service";

@Controller("projects/:projectId/tasks")
@ApiBearerAuth("JWT-auth")
@UseGuards(AuthGuard, TaskAccessGuard)
export class TasksController {
	constructor(private readonly tasksService: TasksService) {}

	@Get()
	findAll(@Param("projectId") projectId: string) {
		return this.tasksService.findAll(projectId);
	}

	@Get(":id")
	findOne(
		@Param("projectId") projectId: string,
		@Param("id") id: string,
		@Req() req,
	) {
		return req.task;
	}

	@Post()
	create(
		@Param("projectId") projectId: string,
		@Body() createTaskDto: CreateTaskDto,
	) {
		return this.tasksService.create(projectId, createTaskDto);
	}

	@Patch(":id")
	update(
		@Param("projectId") projectId: string,
		@Param("id") id: string,
		@Body() updateTaskDto: UpdateTaskDto,
	) {
		return this.tasksService.update(id, updateTaskDto);
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	remove(@Param("projectId") projectId: string, @Param("id") id: string) {
		return this.tasksService.remove(id);
	}
}
