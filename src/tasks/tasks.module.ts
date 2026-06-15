import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProjectsModule } from "src/projects/projects.module";
import { Comment, CommentSchema } from "src/comments/comment.schema";
import { Task, TaskSchema } from "./task.schema";
import { TasksController } from "./tasks.controller";
import { TaskAccessGuard } from "./tasks.guard";
import { TasksService } from "./tasks.service";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Task.name, schema: TaskSchema },
			{ name: Comment.name, schema: CommentSchema },
		]),
		ProjectsModule,
	],
	controllers: [TasksController],
	providers: [TasksService, TaskAccessGuard],
})
export class TasksModule {}
