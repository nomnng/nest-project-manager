import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProjectsModule } from "src/projects/projects.module";
import { Task, TaskSchema } from "src/tasks/task.schema";
import { Comment, CommentSchema } from "./comment.schema";
import { CommentsController } from "./comments.controller";
import { CommentAccessGuard } from "./comments.guard";
import { CommentsService } from "./comments.service";

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: Comment.name, schema: CommentSchema },
			{ name: Task.name, schema: TaskSchema },
		]),
		ProjectsModule,
	],
	controllers: [CommentsController],
	providers: [CommentsService, CommentAccessGuard],
	exports: [CommentsService],
})
export class CommentsModule {}
