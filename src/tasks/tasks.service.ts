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

	async findAll(projectId: string): Promise<Task[]> {
		return this.taskModel.find({ projectId }).exec();
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
