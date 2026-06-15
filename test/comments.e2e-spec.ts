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
import { Comment, CommentDocument } from "src/comments/comment.schema";

describe("CommentsController (e2e)", () => {
	let app: INestApplication<App>;
	let mongod: MongoMemoryServer;
	let projectModel: Model<ProjectDocument>;
	let taskModel: Model<TaskDocument>;
	let commentModel: Model<CommentDocument>;
	let jwtService: JwtService;

	const mainUserId: string = "65c21e3f9b1d8b0015fbe111";
	const otherUserId: string = "65c21e3f9b1d8b0015fbe222";

	const mainProjectId: string = "65c21e3f9b1d8b00bc012111";
	const mainProjectObjectId = new Types.ObjectId(mainProjectId);
	const otherProjectId: string = "65c21e3f9b1d8b00bc012222";
	const otherProjectObjectId = new Types.ObjectId(otherProjectId);

	let userToken: string;
	let mainTask: TaskDocument;

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

		commentModel = moduleFixture.get<Model<CommentDocument>>(
			getModelToken(Comment.name),
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

		mainTask = await new taskModel({
			name: "Main task",
			projectId: mainProjectObjectId,
		}).save();
	});

	describe("GET /comments", () => {
		it("returns comments for a task the user has access to", async () => {
			await new commentModel({
				content: "First comment",
				taskId: mainTask._id,
				authorId: new Types.ObjectId(mainUserId),
			}).save();

			await new commentModel({
				content: "Second comment",
				taskId: mainTask._id,
				authorId: new Types.ObjectId(mainUserId),
			}).save();

			const response = await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks/${mainTask._id}/comments`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body).toHaveLength(2);
			expect(response.body).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ content: "First comment" }),
					expect.objectContaining({ content: "Second comment" }),
				]),
			);
		});

		it("returns 403 Forbidden when user does not have access to the project", async () => {
			const otherTask = await new taskModel({
				name: "Other task",
				projectId: otherProjectObjectId,
			}).save();

			await request(app.getHttpServer())
				.get(`/projects/${otherProjectId}/tasks/${otherTask._id}/comments`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.FORBIDDEN);
		});

		it("returns 404 Not found when task does not belong to the project", async () => {
			const otherTask = await new taskModel({
				name: "Other task",
				projectId: otherProjectObjectId,
			}).save();

			await request(app.getHttpServer())
				.get(`/projects/${mainProjectId}/tasks/${otherTask._id}/comments`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NOT_FOUND);
		});
	});

	describe("GET /comments/:id", () => {
		it("returns the comment that user has access to", async () => {
			const comment = await new commentModel({
				content: "A comment",
				taskId: mainTask._id,
				authorId: new Types.ObjectId(mainUserId),
			}).save();

			const response = await request(app.getHttpServer())
				.get(
					`/projects/${mainProjectId}/tasks/${mainTask._id}/comments/${comment._id}`,
				)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body).toEqual(
				expect.objectContaining({ content: "A comment" }),
			);
		});

		it("returns 404 Not found when comment does not belong to the task", async () => {
			const otherTask = await new taskModel({
				name: "Other main task",
				projectId: mainProjectObjectId,
			}).save();

			const comment = await new commentModel({
				content: "Other task comment",
				taskId: otherTask._id,
				authorId: new Types.ObjectId(mainUserId),
			}).save();

			await request(app.getHttpServer())
				.get(
					`/projects/${mainProjectId}/tasks/${mainTask._id}/comments/${comment._id}`,
				)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NOT_FOUND);
		});
	});

	describe("POST /comments", () => {
		it("creates a comment successfully", async () => {
			const createCommentDto = {
				content: "New comment",
			};

			const response = await request(app.getHttpServer())
				.post(`/projects/${mainProjectId}/tasks/${mainTask._id}/comments`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(createCommentDto)
				.expect(HttpStatus.CREATED);

			expect(response.body).toEqual(
				expect.objectContaining({
					_id: expect.any(String),
					content: "New comment",
					taskId: mainTask.id,
					authorId: mainUserId,
				}),
			);

			const createdComment = await commentModel.findById(response.body._id);
			expect(createdComment?.content).toBe(createCommentDto.content);
			expect(createdComment?.taskId).toBe(mainTask.id);
		});

		it("returns 400 Bad request when content is empty", async () => {
			await request(app.getHttpServer())
				.post(`/projects/${mainProjectId}/tasks/${mainTask._id}/comments`)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ content: "" })
				.expect(HttpStatus.BAD_REQUEST);
		});
	});

	describe("PATCH /comments/:id", () => {
		it("updates a comment successfully", async () => {
			const comment = await new commentModel({
				content: "Original content",
				taskId: mainTask._id,
				authorId: new Types.ObjectId(mainUserId),
			}).save();

			const response = await request(app.getHttpServer())
				.patch(
					`/projects/${mainProjectId}/tasks/${mainTask._id}/comments/${comment._id}`,
				)
				.set("Authorization", `Bearer ${userToken}`)
				.send({ content: "Updated content" })
				.expect(HttpStatus.OK);

			expect(response.body).toEqual(
				expect.objectContaining({ content: "Updated content" }),
			);

			const updatedComment = await commentModel.findById(comment.id);
			expect(updatedComment?.content).toEqual("Updated content");
		});
	});

	describe("DELETE /comments/:id", () => {
		it("deletes a comment successfully", async () => {
			const comment = await new commentModel({
				content: "To be deleted",
				taskId: mainTask._id,
				authorId: new Types.ObjectId(mainUserId),
			}).save();

			await request(app.getHttpServer())
				.delete(
					`/projects/${mainProjectId}/tasks/${mainTask._id}/comments/${comment._id}`,
				)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NO_CONTENT);

			const deletedComment = await commentModel.findById(comment._id);
			expect(deletedComment).toBeNull();
		});
	});
});
