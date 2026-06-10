import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { ProjectsService } from "./projects.service";
import { Project, ProjectDocument } from "./project.schema";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

describe("ProjectsService", () => {
	let service: ProjectsService;
	let model: Model<ProjectDocument>;

	const mockModelFactory = () => {
		const mockQuery = {
			exec: jest.fn(),
		};

		const modelMock: any = jest.fn().mockImplementation((dto) => ({
			...dto,
			save: jest.fn().mockResolvedValue({ _id: "project-id", ...dto }),
		}));

		modelMock.find = jest.fn().mockReturnValue(mockQuery);
		modelMock.findById = jest.fn().mockReturnValue(mockQuery);
		modelMock.findOneAndUpdate = jest.fn().mockReturnValue(mockQuery);
		modelMock.findOneAndDelete = jest.fn().mockReturnValue(mockQuery);

		return modelMock;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectsService,
				{
					provide: getModelToken(Project.name),
					useFactory: mockModelFactory,
				},
			],
		}).compile();

		service = module.get<ProjectsService>(ProjectsService);
		model = module.get<Model<ProjectDocument>>(getModelToken(Project.name));
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("create", () => {
		it("should successfully create and return a project", async () => {
			const ownerId = "user-123";
			const createProjectDto: CreateProjectDto = {
				name: "New Project",
				description: "Project Description",
			} as any;

			const result = await service.create(createProjectDto, ownerId);

			expect(model).toHaveBeenCalledWith({
				...createProjectDto,
				ownerId,
			});
			expect(result).toHaveProperty("_id", "project-id");
			expect(result.name).toBe("New Project");
		});
	});

	describe("findAll", () => {
		it("should return projects where user is owner or member", async () => {
			const userId = "user-123";
			const mockProjects = [{ name: "Project 1" }, { name: "Project 2" }];
			const mockQuery = model.find({});
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockProjects);

			const result = await service.findAll(userId);

			expect(model.find).toHaveBeenCalledWith({
				$or: [{ ownerId: userId }, { memberIds: userId }],
			});
			expect(result).toEqual(mockProjects);
		});
	});

	describe("findOne", () => {
		it("should return a project if found", async () => {
			const projectId = "project-123";
			const mockProject = { _id: projectId, name: "Existing Project" };
			const mockQuery = model.findById(projectId);
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockProject);

			const result = await service.findOne(projectId);

			expect(model.findById).toHaveBeenCalledWith(projectId);
			expect(result).toEqual(mockProject);
		});

		it("should throw NotFoundException if project does not exist", async () => {
			const mockQuery = model.findById("invalid-id");
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(service.findOne("invalid-id")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("update", () => {
		it("should update and return the project", async () => {
			const projectId = "project-123";
			const updateDto: UpdateProjectDto = { name: "Updated Project Name" };
			const mockProject = { _id: projectId, name: "Updated Project Name" };
			const mockQuery = model.findOneAndUpdate({}, {}, {});
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockProject);

			const result = await service.update(projectId, updateDto);

			expect(model.findOneAndUpdate).toHaveBeenCalledWith(
				{ _id: projectId },
				updateDto,
				{ new: true },
			);
			expect(result).toEqual(mockProject);
		});

		it("should throw NotFoundException if project to update does not exist", async () => {
			const mockQuery = model.findOneAndUpdate({}, {}, {});
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(
				service.update("invalid-id", { name: "New Name" }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("remove", () => {
		it("should delete the project successfully", async () => {
			const projectId = "project-123";
			const mockQuery = model.findOneAndDelete({});
			(mockQuery.exec as jest.Mock).mockResolvedValue({ _id: projectId });

			await expect(service.remove(projectId)).resolves.not.toThrow();
			expect(model.findOneAndDelete).toHaveBeenCalledWith({ _id: projectId });
		});

		it("should throw NotFoundException if project to delete does not exist", async () => {
			const mockQuery = model.findOneAndDelete({});
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(service.remove("invalid-id")).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
