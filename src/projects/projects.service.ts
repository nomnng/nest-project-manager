import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { Project, ProjectDocument } from "./project.schema";

@Injectable()
export class ProjectsService {
	constructor(
		@InjectModel(Project.name)
		private readonly projectModel: Model<ProjectDocument>,
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
		const result = await this.projectModel.findOneAndDelete({ _id: id }).exec();
		if (!result) {
			throw new NotFoundException("Project not found");
		}
	}
}
