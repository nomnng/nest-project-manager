import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { NotFoundException } from "@nestjs/common";
import { Model } from "mongoose";
import { TasksService } from "./tasks.service";
import { Task, TaskDocument } from "./task.schema";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

describe("TasksService", () => {
	let service: TasksService;
	let model: Model<TaskDocument>;

	const mockModelFactory = () => {
		const mockQuery = {
			sort: jest.fn().mockReturnThis(),
			exec: jest.fn(),
		};

		const modelMock: any = jest.fn().mockImplementation((dto) => ({
			...dto,
			save: jest.fn().mockResolvedValue({ _id: "task-id", ...dto }),
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
				TasksService,
				{
					provide: getModelToken(Task.name),
					useFactory: mockModelFactory,
				},
			],
		}).compile();

		service = module.get<TasksService>(TasksService);
		model = module.get<Model<TaskDocument>>(getModelToken(Task.name));
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("create", () => {
		it("should successfully create and return a task", async () => {
			const projectId = "project-123";
			const createTaskDto: CreateTaskDto = {
				name: "Test Task",
				description: "Test Desc",
			} as any;

			const result = await service.create(projectId, createTaskDto);

			expect(model).toHaveBeenCalledWith({
				...createTaskDto,
				projectId,
			});
			expect(result).toHaveProperty("_id", "task-id");
			expect(result.name).toBe("Test Task");
		});
	});

	describe("findAll", () => {
		it("should return tasks with basic filtering by projectId", async () => {
			const mockTasks = [{ name: "Task 1" }, { name: "Task 2" }];
			const mockQuery = model.find({ projectId: "project-123" });
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockTasks);

			const result = await service.findAll("project-123");

			expect(model.find).toHaveBeenCalledWith({ projectId: "project-123" });
			expect(result).toEqual(mockTasks);
		});

		it("should escape search text and apply regex filter correctly", async () => {
			const mockQuery = model.find({});
			(mockQuery.exec as jest.Mock).mockResolvedValue([]);

			await service.findAll("project-123", { search: "test.tag+" });

			expect(model.find).toHaveBeenCalledWith({
				projectId: "project-123",
				$or: [
					{ name: /test\.tag\+/i },
					{ description: /test\.tag\+/i },
					{ tags: /test\.tag\+/i },
				],
			});
		});

		it("should apply sorting options when valid sortBy is provided", async () => {
			const mockQuery = model.find({});
			(mockQuery.exec as jest.Mock).mockResolvedValue([]);

			await service.findAll("project-123", {
				sortBy: "createdAt",
				sortOrder: "desc",
			});

			expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
		});
	});

	describe("findOne", () => {
		it("should return a task if found", async () => {
			const mockTask = { _id: "task-123", name: "Found Task" };
			const mockQuery = model.findById("task-123");
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockTask);

			const result = await service.findOne("task-123");

			expect(model.findById).toHaveBeenCalledWith("task-123");
			expect(result).toEqual(mockTask);
		});

		it("should throw NotFoundException if task does not exist", async () => {
			const mockQuery = model.findById("invalid-id");
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(service.findOne("invalid-id")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("update", () => {
		it("should update and return the task", async () => {
			const updateDto: UpdateTaskDto = { name: "Updated Name" };
			const mockTask = { _id: "task-123", name: "Updated Name" };
			const mockQuery = model.findOneAndUpdate({}, {}, {});
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockTask);

			const result = await service.update("task-123", updateDto);

			expect(model.findOneAndUpdate).toHaveBeenCalledWith(
				{ _id: "task-123" },
				updateDto,
				{ new: true },
			);
			expect(result).toEqual(mockTask);
		});

		it("should throw NotFoundException if task to update does not exist", async () => {
			const mockQuery = model.findOneAndUpdate({}, {}, {});
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(
				service.update("invalid-id", { name: "New" }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("remove", () => {
		it("should delete the task successfully", async () => {
			const mockQuery = model.findOneAndDelete({});
			(mockQuery.exec as jest.Mock).mockResolvedValue({ _id: "task-123" });

			await expect(service.remove("task-123")).resolves.not.toThrow();
			expect(model.findOneAndDelete).toHaveBeenCalledWith({ _id: "task-123" });
		});

		it("should throw NotFoundException if task to delete does not exist", async () => {
			const mockQuery = model.findOneAndDelete({});
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(service.remove("invalid-id")).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
