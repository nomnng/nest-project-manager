import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ProjectsService } from "src/projects/projects.service";
import { ProjectDocument } from "src/projects/project.schema";
import { CreateTaskDto } from "./dto/create-task.dto";
import {
	FindTasksQueryDto,
	TASK_SORT_FIELDS,
} from "./dto/find-tasks-query.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { Task, TaskDocument } from "./task.schema";

@Injectable()
export class TasksService {
	constructor(
		@InjectModel(Task.name)
		private readonly taskModel: Model<TaskDocument>,
	) {}

	async create(projectId: string, createTaskDto: CreateTaskDto): Promise<Task> {
		const task = new this.taskModel({
			...createTaskDto,
			projectId,
		});
		return task.save();
	}

	async findAll(
		projectId: string,
		query: FindTasksQueryDto = {},
	): Promise<Task[]> {
		const filter: Record<string, unknown> = { projectId };

		const search = query.search?.trim();
		if (search) {
			const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
			const regex = new RegExp(escaped, "i");
			filter.$or = [{ name: regex }, { description: regex }, { tags: regex }];
		}

		let queryBuilder = this.taskModel.find(filter);

		if (query.sortBy && TASK_SORT_FIELDS.includes(query.sortBy)) {
			const direction = query.sortOrder === "desc" ? -1 : 1;
			queryBuilder = queryBuilder.sort({ [query.sortBy]: direction });
		}

		return queryBuilder.exec();
	}

	async findOne(id: string): Promise<Task> {
		const task = await this.taskModel.findById(id).exec();
		if (!task) {
			throw new NotFoundException("Task not found");
		}
		return task;
	}

	async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
		const task = await this.taskModel
			.findOneAndUpdate({ _id: id }, updateTaskDto, { new: true })
			.exec();
		if (!task) {
			throw new NotFoundException("Task not found");
		}
		return task;
	}

	async remove(id: string): Promise<void> {
		const result = await this.taskModel.findOneAndDelete({ _id: id }).exec();
		if (!result) {
			throw new NotFoundException("Task not found");
		}
	}
}
