import { Test, TestingModule } from "@nestjs/testing";
import { HttpStatus, INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import request from "supertest";
import { App } from "supertest/types";
import { Connection, Model, Types } from "mongoose";
import { getModelToken } from "@nestjs/mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AppModule } from "./../src/app.module";
import { Project, ProjectDocument } from "src/projects/project.schema";
import { JwtService } from "@nestjs/jwt";
import { Task, TaskDocument } from "src/tasks/task.schema";

describe("TasksController (e2e)", () => {
	let app: INestApplication<App>;
	let mongod: MongoMemoryServer;
	let projectModel: Model<ProjectDocument>;
	let taskModel: Model<TaskDocument>;
	let jwtService: JwtService;

	const mainUserId: string = "65c21e3f9b1d8b0015fbe111";
	const otherUserId: string = "65c21e3f9b1d8b0015fbe222";

	const mainProjectId: string = "65c21e3f9b1d8b00bc012111";
	const mainProjectObjectId = new Types.ObjectId(mainProjectId);
	const otherProjectId: string = "65c21e3f9b1d8b00bc012222";
	const otherProjectObjectId = new Types.ObjectId(otherProjectId);

	let userToken: string;

	beforeAll(async () => {
		mongod = await MongoMemoryServer.create();
		process.env.MONGO_URI = mongod.getUri();
		process.env.JWT_SECRET = "e2e-test-jwt-secret";

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication();
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true,
			}),
		);
		await app.init();

		projectModel = moduleFixture.get<Model<ProjectDocument>>(
			getModelToken(Project.name),
		);

		taskModel = moduleFixture.get<Model<TaskDocument>>(
			getModelToken(Task.name),
		);

		jwtService = moduleFixture.get<JwtService>(JwtService);
		const jwtPayload = { id: mainUserId };
		userToken = await jwtService.signAsync(jwtPayload);
	});

	afterAll(async () => {
		await app.close();
		await mongod.stop();
	});

	beforeEach(async () => {
		const connection = app.get<Connection>(getConnectionToken());
		if (connection.db) {
			await connection.db.dropDatabase();
		}

		await new projectModel({
			_id: mainProjectObjectId,
			name: "Main project",
			ownerId: new Types.ObjectId(mainUserId),
		}).save();

		await new projectModel({
			_id: otherProjectObjectId,
			name: "Other project",
			ownerId: new Types.ObjectId(otherUserId),
		}).save();

		await taskModel.ensureIndexes();
	});

	describe("GET /tasks", () => {
		it("returns tasks from the project that user has access to", async () => {
			await new taskModel({
				name: "Main project task 1",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "Main project task 2",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "Other project task 1",
				projectId: otherProjectObjectId,
			}).save();

			const response = await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body).toHaveLength(2);
			expect(response.body).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Main project task 1" }),
					expect.objectContaining({ name: "Main project task 2" }),
				]),
			);
		});

		it("returns only tasks that match the search query", async () => {
			await new taskModel({
				name: "Shopping task",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "Groceries task",
				projectId: mainProjectObjectId,
				tags: ["Shopping"],
			}).save();

			await new taskModel({
				name: "Laundry task",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "Food task",
				projectId: mainProjectObjectId,
				description: "Buy food during shopping",
			}).save();

			const response = await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks?search=shopping`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body).toHaveLength(3);
			expect(response.body).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Groceries task" }),
					expect.objectContaining({ name: "Shopping task" }),
					expect.objectContaining({ name: "Food task" }),
				]),
			);
		});

		it("sorts tasks in ascending order by default", async () => {
			await new taskModel({
				name: "B task",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "C task",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "A task",
				projectId: mainProjectObjectId,
			}).save();

			const response = await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks?sortBy=name&sortOrder=asc`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body[0].name).toBe("A task");
			expect(response.body[1].name).toBe("B task");
			expect(response.body[2].name).toBe("C task");
		});

		it("sorts tasks in descending order", async () => {
			await new taskModel({
				name: "B task",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "C task",
				projectId: mainProjectObjectId,
			}).save();

			await new taskModel({
				name: "A task",
				projectId: mainProjectObjectId,
			}).save();

			const response = await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks?sortBy=name&sortOrder=desc`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body[0].name).toBe("C task");
			expect(response.body[1].name).toBe("B task");
			expect(response.body[2].name).toBe("A task");
		});

		it("returns 400 Bad request if sortBy is invalid", async () => {
			await new taskModel({
				name: "Some task",
				projectId: mainProjectObjectId,
			}).save();

			await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks?sortBy=wrongField`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.BAD_REQUEST);
		});
	});

	describe("GET /tasks/:id", () => {
		it("returns the task that user has access to", async () => {
			const task = await new taskModel({
				name: "Task",
				projectId: mainProjectObjectId,
			}).save();

			const response = await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks/${task._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body).toEqual(expect.objectContaining({ name: "Task" }));
		});

		it("returns 403 Forbidden when user don't have access to the task", async () => {
			const task = await new taskModel({
				name: "Task",
				projectId: otherProjectObjectId,
			}).save();

			await request(app.getHttpServer())
				.get(`/projects/${otherProjectId}/tasks/${task._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.FORBIDDEN);
		});

		it("returns 404 Not found when can't find the task inside the project", async () => {
			const task = await new taskModel({
				name: "Task",
				projectId: otherProjectObjectId,
			}).save();

			await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks/${task._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NOT_FOUND);
		});
	});

	describe("POST /tasks/", () => {
		it("creates a task successfully", async () => {
			const createTaskDto = {
				name: "New task",
				tags: ["important", "test"],
				deadline: new Date().toISOString(),
				description: "Task description text",
			};

			const response = await request(app.getHttpServer())
				.post(`/projects/${mainProjectId}/tasks`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(createTaskDto)
				.expect(HttpStatus.CREATED);

			expect(response.body).toEqual(
				expect.objectContaining({
					_id: expect.any(String),
					...createTaskDto,
				}),
			);

			const createdTask = await taskModel.findById(response.body._id);
			expect(createdTask?.name).toBe(createTaskDto.name);
		});

		it("returns 403 Forbidden if user doesn't have access to the project", async () => {
			const createTaskDto = {
				name: "New task",
			};

			await request(app.getHttpServer())
				.post(`/projects/${otherProjectId}/tasks`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(createTaskDto)
				.expect(HttpStatus.FORBIDDEN);
		});
	});

	describe("PATCH /tasks/:id", () => {
		it("updates the task", async () => {
			const task = await new taskModel({
				name: "Task",
				projectId: mainProjectObjectId,
				description: "Description",
			}).save();

			const updateTaskDto = {
				name: "Updated task",
				description: "Updated description",
				tags: ["New tag"],
			};

			const response = await request(app.getHttpServer())
				.patch(`/projects/${mainProjectId}/tasks/${task._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(updateTaskDto)
				.expect(HttpStatus.OK);

			expect(response.body).toEqual(
				expect.objectContaining({
					_id: task.id,
					...updateTaskDto,
				}),
			);

			const updatedTask = await taskModel.findById(response.body._id);
			expect(updatedTask).toEqual(expect.objectContaining(updateTaskDto));
		});

		it("returns 403 Forbidden if user doesn't have access to the project", async () => {
			const task = await new taskModel({
				name: "Task",
				projectId: otherProjectObjectId,
				description: "Description",
			}).save();

			const updateTaskDto = {
				name: "Updated task",
			};

			await request(app.getHttpServer())
				.patch(`/projects/${otherProjectId}/tasks/${task._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(updateTaskDto)
				.expect(HttpStatus.FORBIDDEN);
		});
	});

	describe("DELETE /tasks/:id", () => {
		it("deletes the task", async () => {
			const task = await new taskModel({
				name: "Task",
				projectId: mainProjectObjectId,
			}).save();

			await request(app.getHttpServer())
				.delete(`/projects/${mainProjectId}/tasks/${task._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NO_CONTENT);

			const deletedTask = await taskModel.findById(task._id);
			expect(deletedTask).toBeNull();
		});

		it("returns 403 Forbidden if user doesn't have access to the project", async () => {
			const task = await new taskModel({
				name: "Task",
				projectId: otherProjectObjectId,
			}).save();

			await request(app.getHttpServer())
				.delete(`/projects/${otherProjectId}/tasks/${task._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.FORBIDDEN);

			const taskInDb = await taskModel.findById(task._id);
			expect(taskInDb).toBeTruthy();
		});
	});
});
