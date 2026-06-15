import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
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
		if (createTaskDto.parentTask) {
			const parentTask = await this.taskModel
				.findById(createTaskDto.parentTask)
				.exec();
			if (!parentTask) {
				throw new NotFoundException("Parent task not found");
			}

			if (parentTask.projectId.toString() !== projectId) {
				throw new BadRequestException(
					"Parent task must belong to the same project",
				);
			}
		}

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
		const filter: Record<string, unknown> = {
			projectId: new Types.ObjectId(projectId),
		};

		const search = query.search?.trim();
		if (search) {
			filter.$text = { $search: search };
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
		const currentTask = await this.taskModel.findById(id).exec();
		if (!currentTask) {
			throw new NotFoundException("Task not found");
		}

		if (updateTaskDto.parentTask) {
			const newParentId = updateTaskDto.parentTask;

			const parentTask = await this.taskModel.findById(newParentId).exec();
			if (!parentTask) {
				throw new NotFoundException("Parent task not found");
			}

			if (
				parentTask.projectId.toString() !== currentTask.projectId.toString()
			) {
				throw new ForbiddenException(
					"Parent task must belong to the same project",
				);
			}
		}

		currentTask.set(updateTaskDto);
		return currentTask.save();
	}

	async remove(id: string): Promise<void> {
		const taskToDelete = await this.taskModel.findById(id).exec();
		if (!taskToDelete) {
			throw new NotFoundException("Task not found");
		}

		const subtasks = await this.getAllSubtasks(id);
		const subtaskIds = subtasks.map((subtask) => subtask._id);

		await this.taskModel
			.deleteMany({
				_id: { $in: [taskToDelete._id, ...subtaskIds] },
			})
			.exec();
	}

	async getAllSubtasks(taskId: string): Promise<Task[]> {
		const [result] = await this.taskModel.aggregate([
			{
				$match: { _id: new Types.ObjectId(taskId) },
			},
			{
				$graphLookup: {
					from: this.taskModel.collection.name,
					startWith: "$_id",
					connectFromField: "_id",
					connectToField: "parentTask",
					as: "allNestedSubtasks",
				},
			},
			{
				$project: {
					_id: 0,
					allNestedSubtasks: 1,
				},
			},
		]);

		return result?.allNestedSubtasks ?? [];
	}
}
