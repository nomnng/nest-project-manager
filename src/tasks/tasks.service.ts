import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateTaskDto } from "./dto/create-task.dto";
import {
	FindTasksQueryDto,
	TASK_SORT_FIELDS,
} from "./dto/find-tasks-query.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { Comment, CommentDocument } from "src/comments/comment.schema";
import { Task, TaskDocument } from "./task.schema";
import { TaskNotFoundException } from "./errors/task-not-found.exception";
import { TaskInvalidParentException } from "./errors/task-invalid-parent.exception";
import { TaskInvalidCoordsException } from "./errors/task-invalid-coords.exception";

@Injectable()
export class TasksService {
	constructor(
		@InjectModel(Task.name)
		private readonly taskModel: Model<TaskDocument>,
		@InjectModel(Comment.name)
		private readonly commentModel: Model<CommentDocument>,
	) {}

	async create(projectId: string, createTaskDto: CreateTaskDto): Promise<Task> {
		if (createTaskDto.parentTask) {
			const parentTask = await this.taskModel
				.findById(createTaskDto.parentTask)
				.exec();
			if (!parentTask) {
				throw new TaskNotFoundException(createTaskDto.parentTask);
			}

			if (parentTask.projectId.toString() !== projectId) {
				throw new TaskInvalidParentException(parentTask.id);
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

	async findNearLocation(
		projectId: string,
		query: FindTasksQueryDto,
	): Promise<Task[]> {
		const { longitude, latitude } = query;
		if (longitude === undefined || latitude === undefined) {
			throw new TaskInvalidCoordsException(longitude, latitude);
		}

		return this.taskModel
			.aggregate([
				{
					$geoNear: {
						near: {
							type: "Point",
							coordinates: [longitude, latitude],
						},
						distanceField: "distance",
						spherical: true,
						query: { projectId: new Types.ObjectId(projectId) },
					},
				},
			])
			.exec();
	}

	async findOne(id: string): Promise<Task> {
		const task = await this.taskModel.findById(id).exec();
		if (!task) {
			throw new TaskNotFoundException(id);
		}
		return task;
	}

	async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
		const currentTask = await this.taskModel.findById(id).exec();
		if (!currentTask) {
			throw new TaskNotFoundException(id);
		}

		if (updateTaskDto.parentTask) {
			const newParentId = updateTaskDto.parentTask;

			const parentTask = await this.taskModel.findById(newParentId).exec();
			if (!parentTask) {
				throw new TaskNotFoundException(newParentId);
			}

			if (
				parentTask.projectId.toString() !== currentTask.projectId.toString()
			) {
				throw new TaskInvalidParentException(parentTask.id);
			}
		}

		currentTask.set(updateTaskDto);
		return currentTask.save();
	}

	async remove(id: string): Promise<void> {
		const taskToDelete = await this.taskModel.findById(id).exec();
		if (!taskToDelete) {
			throw new TaskNotFoundException(id);
		}

		const subtasks = await this.getAllSubtasks(id);
		const subtaskIds = subtasks.map((subtask) => subtask._id);
		const allTaskIds = [taskToDelete._id, ...subtaskIds];

		await this.commentModel.deleteMany({ taskId: { $in: allTaskIds } }).exec();

		await this.taskModel
			.deleteMany({
				_id: { $in: allTaskIds },
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
