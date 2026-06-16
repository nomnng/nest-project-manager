import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Comment, CommentDocument } from "src/comments/comment.schema";
import { Task, TaskDocument } from "src/tasks/task.schema";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { Project, ProjectDocument } from "./project.schema";
import { TaskStatus } from "src/tasks/task-status.enum";

@Injectable()
export class ProjectsService {
	constructor(
		@InjectModel(Project.name)
		private readonly projectModel: Model<ProjectDocument>,
		@InjectModel(Task.name)
		private readonly taskModel: Model<TaskDocument>,
		@InjectModel(Comment.name)
		private readonly commentModel: Model<CommentDocument>,
	) {}

	async create(
		createProjectDto: CreateProjectDto,
		ownerId: string,
	): Promise<Project> {
		const ownerObjectId = new Types.ObjectId(ownerId);
		const project = new this.projectModel({
			...createProjectDto,
			ownerId: ownerObjectId,
		});
		return project.save();
	}

	async findAll(userId: string): Promise<Project[]> {
		const userObjectId = new Types.ObjectId(userId);
		return this.projectModel
			.find({
				$or: [{ ownerId: userObjectId }, { memberIds: userObjectId }],
			})
			.exec();
	}

	async findOne(id: string): Promise<Project> {
		const project = await this.projectModel.findById(id).exec();
		if (!project) {
			throw new NotFoundException("Project not found");
		}
		return project;
	}

	async update(
		id: string,
		updateProjectDto: UpdateProjectDto,
	): Promise<Project> {
		const project = await this.projectModel
			.findOneAndUpdate({ _id: id }, updateProjectDto, { new: true })
			.exec();
		if (!project) {
			throw new NotFoundException("Project not found");
		}
		return project;
	}

	async remove(id: string): Promise<void> {
		const project = await this.projectModel.findById(id).exec();
		if (!project) {
			throw new NotFoundException("Project not found");
		}

		const projectObjectId = new Types.ObjectId(id);
		const tasks = await this.taskModel
			.find({ projectId: projectObjectId })
			.select("_id")
			.exec();
		const taskIds = tasks.map((task) => task._id);

		await this.commentModel.deleteMany({ taskId: { $in: taskIds } }).exec();
		await this.taskModel.deleteMany({ projectId: projectObjectId }).exec();
		await this.projectModel.findByIdAndDelete(id).exec();
	}

	async getProjectStats(id: string) {
		const now = new Date();
		const projectObjectId = new Types.ObjectId(id);

		const stats = await this.taskModel.aggregate([
			{ $match: { projectId: projectObjectId } },
			{
				$facet: {
					statusOverview: [
						{
							$group: {
								_id: "$status",
								count: { $sum: 1 },
							},
						},
					],
					deadlineStats: [
						{
							$match: {
								deadline: { $exists: true, $ne: null },
								status: { $ne: TaskStatus.DONE },
							},
						},
						{
							$group: {
								_id: null,
								overdueCount: {
									$sum: { $cond: [{ $lt: ["$deadline", now] }, 1, 0] },
								},
								hasDeadlineCount: { $sum: 1 },
							},
						},
					],
					topTags: [
						{ $unwind: "$tags" },
						{ $group: { _id: "$tags", count: { $sum: 1 } } },
						{ $sort: { count: -1 } },
						{ $limit: 5 },
					],
				},
			},

			{
				$project: {
					totalTasks: { $sum: "$statusOverview.count" },
					statuses: {
						$arrayToObject: {
							$map: {
								input: "$statusOverview",
								as: "status",
								in: { k: "$$status._id", v: "$$status.count" },
							},
						},
					},
					overdueTasks: {
						$ifNull: [{ $arrayElemAt: ["$deadlineStats.overdueCount", 0] }, 0],
					},
					popularTags: {
						$arrayToObject: {
							$map: {
								input: "$topTags",
								as: "tags",
								in: { k: "$$tags._id", v: "$$tags.count" },
							},
						},
					},
				},
			},
		]);

		return (
			stats[0] || {
				totalTasks: 0,
				statuses: {},
				overdueTasks: 0,
				popularTags: [],
			}
		);
	}
}
