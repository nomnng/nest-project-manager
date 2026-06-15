import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { NotFoundException } from "@nestjs/common";
import { Model, Types } from "mongoose";
import { Comment, CommentDocument } from "src/comments/comment.schema";
import { TasksService } from "./tasks.service";
import { Task, TaskDocument } from "./task.schema";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";

const projectId = "507f1f77bcf86cd799439011";
const taskId = "507f1f77bcf86cd799439012";

describe("TasksService", () => {
	let service: TasksService;
	let model: Model<TaskDocument>;
	let commentModel: Model<CommentDocument>;

	const mockModelFactory = () => {
		const mockQuery = {
			sort: jest.fn().mockReturnThis(),
			exec: jest.fn(),
		};

		const modelMock: any = jest.fn().mockImplementation((dto) => ({
			...dto,
			save: jest.fn().mockResolvedValue({ _id: taskId, ...dto }),
		}));

		modelMock.find = jest.fn().mockReturnValue(mockQuery);
		modelMock.findById = jest.fn().mockReturnValue(mockQuery);
		modelMock.findOneAndUpdate = jest.fn().mockReturnValue(mockQuery);
		modelMock.findOneAndDelete = jest.fn().mockReturnValue(mockQuery);
		modelMock.deleteMany = jest.fn().mockReturnValue(mockQuery);
		modelMock.aggregate = jest.fn();
		modelMock.collection = { name: "tasks" };

		return modelMock;
	};

	const mockCommentModelFactory = () => {
		const mockQuery = {
			exec: jest.fn(),
		};

		return {
			deleteMany: jest.fn().mockReturnValue(mockQuery),
		};
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TasksService,
				{
					provide: getModelToken(Task.name),
					useFactory: mockModelFactory,
				},
				{
					provide: getModelToken(Comment.name),
					useFactory: mockCommentModelFactory,
				},
			],
		}).compile();

		service = module.get<TasksService>(TasksService);
		model = module.get<Model<TaskDocument>>(getModelToken(Task.name));
		commentModel = module.get<Model<CommentDocument>>(
			getModelToken(Comment.name),
		);
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("create", () => {
		it("should successfully create and return a task", async () => {
			const createTaskDto: CreateTaskDto = {
				name: "Test Task",
				description: "Test Desc",
			} as any;

			const result = await service.create(projectId, createTaskDto);

			expect(model).toHaveBeenCalledWith({
				...createTaskDto,
				projectId,
			});
			expect(result).toHaveProperty("_id", taskId);
			expect(result.name).toBe("Test Task");
		});
	});

	describe("findAll", () => {
		it("should return tasks with basic filtering by projectId", async () => {
			const mockTasks = [{ name: "Task 1" }, { name: "Task 2" }];
			const mockQuery = model.find({ projectId });
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockTasks);

			const result = await service.findAll(projectId);

			expect(model.find).toHaveBeenCalledWith({
				projectId: new Types.ObjectId(projectId),
			});
			expect(result).toEqual(mockTasks);
		});

		it("should apply text search filter when search is provided", async () => {
			const mockQuery = model.find({});
			(mockQuery.exec as jest.Mock).mockResolvedValue([]);

			await service.findAll(projectId, { search: "test.tag+" });

			expect(model.find).toHaveBeenCalledWith({
				projectId: new Types.ObjectId(projectId),
				$text: { $search: "test.tag+" },
			});
		});

		it("should apply sorting options when valid sortBy is provided", async () => {
			const mockQuery = model.find({});
			(mockQuery.exec as jest.Mock).mockResolvedValue([]);

			await service.findAll(projectId, {
				sortBy: "createdAt",
				sortOrder: "desc",
			});

			expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
		});
	});

	describe("findOne", () => {
		it("should return a task if found", async () => {
			const mockTask = { _id: taskId, name: "Found Task" };
			const mockQuery = model.findById(taskId);
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockTask);

			const result = await service.findOne(taskId);

			expect(model.findById).toHaveBeenCalledWith(taskId);
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
			const updatedTask = { _id: taskId, name: "Updated Name" };
			const mockSave = jest.fn().mockResolvedValue(updatedTask);
			const mockTask = {
				_id: taskId,
				projectId: new Types.ObjectId(projectId),
				set: jest.fn(),
				save: mockSave,
			};
			const mockQuery = model.findById(taskId);
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockTask);

			const result = await service.update(taskId, updateDto);

			expect(model.findById).toHaveBeenCalledWith(taskId);
			expect(mockTask.set).toHaveBeenCalledWith(updateDto);
			expect(mockSave).toHaveBeenCalled();
			expect(result).toEqual(updatedTask);
		});

		it("should throw NotFoundException if task to update does not exist", async () => {
			const mockQuery = model.findById("invalid-id");
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(
				service.update("invalid-id", { name: "New" }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("remove", () => {
		it("should delete the task successfully", async () => {
			const taskObjectId = new Types.ObjectId(taskId);

			(model.findById as jest.Mock).mockReturnValue({
				exec: jest.fn().mockResolvedValue({ _id: taskObjectId }),
			});

			(model.aggregate as jest.Mock).mockResolvedValue([
				{ allNestedSubtasks: [] },
			]);

			const deleteManyExec = jest.fn().mockResolvedValue({ deletedCount: 1 });
			(commentModel.deleteMany as jest.Mock).mockReturnValue({
				exec: deleteManyExec,
			});
			(model.deleteMany as jest.Mock).mockReturnValue({ exec: deleteManyExec });

			await expect(service.remove(taskId)).resolves.not.toThrow();
			expect(model.findById).toHaveBeenCalledWith(taskId);
			expect(commentModel.deleteMany).toHaveBeenCalledWith({
				taskId: { $in: [taskObjectId] },
			});
			expect(model.deleteMany).toHaveBeenCalledWith({
				_id: { $in: [taskObjectId] },
			});
		});

		it("should throw NotFoundException if task to delete does not exist", async () => {
			const mockQuery = model.findById("invalid-id");
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(service.remove("invalid-id")).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
