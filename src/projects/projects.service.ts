import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { Project, ProjectDocument } from "./project.schema";

@Injectable()
export class ProjectsService {
	constructor(
		@InjectModel(Project.name)
		private readonly projectModel: Model<ProjectDocument>,
	) {}

	async create(createProjectDto: CreateProjectDto): Promise<Project> {
		const project = new this.projectModel(createProjectDto);
		return project.save();
	}

	async findAll(): Promise<Project[]> {
		return this.projectModel.find().exec();
	}

	async findOne(id: string): Promise<Project> {
		const project = await this.projectModel.findById(id).exec();
		if (!project) {
			throw new NotFoundException("Project not found");
		}
		return project;
	}

	async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
		const project = await this.projectModel
			.findByIdAndUpdate(id, updateProjectDto, { new: true })
			.exec();
		if (!project) {
			throw new NotFoundException("Project not found");
		}
		return project;
	}

	async remove(id: string): Promise<void> {
		const result = await this.projectModel.findByIdAndDelete(id).exec();
		if (!result) {
			throw new NotFoundException("Project not found");
		}
	}
}
