import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Task, TaskSchema } from "src/tasks/task.schema";
import { Project, ProjectSchema } from "./project.schema";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Project.name, schema: ProjectSchema },
			{ name: Task.name, schema: TaskSchema },
		]),
	],
	controllers: [ProjectsController],
	providers: [ProjectsService],
	exports: [ProjectsService],
})
export class ProjectsModule {}
