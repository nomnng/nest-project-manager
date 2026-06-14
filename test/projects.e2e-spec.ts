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
import { User, UserDocument } from "src/users/user.schema";
import { JwtService } from "@nestjs/jwt";

describe("ProjectsController (e2e)", () => {
	let app: INestApplication<App>;
	let mongod: MongoMemoryServer;
	let projectModel: Model<ProjectDocument>;
	let jwtService: JwtService;

	const mainUserId: string = "65c21e3f9b1d8b0015fbe111";
	const otherUserId: string = "65c21e3f9b1d8b0015fbe222";
	const mainUserObjectId = new Types.ObjectId(mainUserId);
	const otherUserObjectId = new Types.ObjectId(otherUserId);

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
	});

	describe("GET /projects", () => {
		it("returns projects where user is owner or member", async () => {
			await new projectModel({
				name: "Project 1",
				ownerId: mainUserObjectId,
			}).save();
			await new projectModel({
				name: "Project 2",
				ownerId: otherUserObjectId,
				memberIds: [mainUserObjectId],
			}).save();
			await new projectModel({
				name: "Project 3",
				ownerId: otherUserObjectId,
			}).save();

			const response = await request(app.getHttpServer())
				.get("/projects")
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body).toEqual([
				expect.objectContaining({ name: "Project 1" }),
				expect.objectContaining({ name: "Project 2" }),
			]);
		});
	});

	describe("GET /projects/:id", () => {
		it("returns the project if user is the owner", async () => {
			const projectName = "My project";
			const project = await new projectModel({
				name: projectName,
				ownerId: mainUserObjectId,
			}).save();

			const response = await request(app.getHttpServer())
				.get(`/projects/${project._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.OK);

			expect(response.body).toEqual(
				expect.objectContaining({ name: projectName }),
			);
		});

		it("returns 403 Forbidden if user is not owner or member", async () => {
			const project = await new projectModel({
				name: "Other project",
				ownerId: otherUserId,
			}).save();

			await request(app.getHttpServer())
				.get(`/projects/${project._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.FORBIDDEN);
		});

		it("returns 404 Not Found if project does not exist", async () => {
			const wrongId = "60c72b2f9b1d8b0015fbe123";

			await request(app.getHttpServer())
				.get(`/projects/${wrongId}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NOT_FOUND);
		});
	});

	describe("POST /projects", () => {
		it("creates a new project", async () => {
			const projectName = "My new project";
			const createProjectDto = {
				name: projectName,
			};

			const response = await request(app.getHttpServer())
				.post("/projects")
				.set("Authorization", `Bearer ${userToken}`)
				.send(createProjectDto)
				.expect(HttpStatus.CREATED);

			expect(response.body).toEqual(
				expect.objectContaining({
					name: projectName,
					ownerId: mainUserId,
				}),
			);

			const savedProject = await projectModel.findById(response.body._id);
			expect(savedProject?.name).toBe(projectName);
		});
	});

	describe("PATCH /projects/:id", () => {
		it("updates existing project where user is owner", async () => {
			const project = await new projectModel({
				name: "My project",
				ownerId: mainUserObjectId,
			}).save();

			const updateProjectDto = {
				name: "Updated project",
				memberIds: [otherUserObjectId],
			};

			const response = await request(app.getHttpServer())
				.patch(`/projects/${project._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(updateProjectDto)
				.expect(HttpStatus.OK);

			expect(response.body).toEqual(
				expect.objectContaining({
					name: "Updated project",
					ownerId: mainUserId,
					memberIds: [otherUserId],
				}),
			);

			const updatedProject = await projectModel.findById(project._id);
			expect(updatedProject).toEqual(
				expect.objectContaining({
					name: "Updated project",
					ownerId: mainUserObjectId,
					memberIds: [otherUserObjectId],
				}),
			);
		});

		it("updates existing project where user is member", async () => {
			const project = await new projectModel({
				name: "My project",
				ownerId: otherUserObjectId,
				memberIds: [mainUserObjectId],
			}).save();

			const someRandomUserId = "65c21e3f9b1d8b0015fbe999";
			const someRandomUserObjectId = new Types.ObjectId(someRandomUserId);
			const updateProjectDto = {
				name: "Updated project",
				memberIds: [mainUserObjectId, someRandomUserObjectId],
			};

			const response = await request(app.getHttpServer())
				.patch(`/projects/${project._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(updateProjectDto)
				.expect(HttpStatus.OK);

			expect(response.body).toEqual(
				expect.objectContaining({
					name: "Updated project",
					ownerId: otherUserId,
					memberIds: [mainUserId, someRandomUserId],
				}),
			);

			const updatedProject = await projectModel.findById(project._id);
			expect(updatedProject).toEqual(
				expect.objectContaining({
					name: "Updated project",
					ownerId: otherUserObjectId,
					memberIds: [mainUserObjectId, someRandomUserObjectId],
				}),
			);
		});

		it("returns 403 Forbidden if user is not owner or member of a project", async () => {
			const project = await new projectModel({
				name: "My project",
				ownerId: otherUserObjectId,
			}).save();

			const updateProjectDto = {
				name: "Updated project",
			};

			await request(app.getHttpServer())
				.patch(`/projects/${project._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.send(updateProjectDto)
				.expect(HttpStatus.FORBIDDEN);
		});
	});

	describe("DELETE /projects/:id", () => {
		it("deletes the project if user has access", async () => {
			const project = await new projectModel({
				name: "My project",
				ownerId: mainUserObjectId,
			}).save();

			await request(app.getHttpServer())
				.delete(`/projects/${project._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NO_CONTENT);

			const deletedProject = await projectModel.findById(project._id);
			expect(deletedProject).toBeNull();
		});

		it("returns 403 Forbidden if user is not owner or member", async () => {
			const project = await new projectModel({
				name: "My project",
				ownerId: otherUserObjectId,
			}).save();

			await request(app.getHttpServer())
				.delete(`/projects/${project._id}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.FORBIDDEN);

			const projectInDb = await projectModel.findById(project._id);
			expect(projectInDb).toBeTruthy();
		});

		it("returns 404 Not Found if project does not exist", async () => {
			const wrongId = "60c72b2f9b1d8b0015fbe123";

			await request(app.getHttpServer())
				.delete(`/projects/${wrongId}`)
				.set("Authorization", `Bearer ${userToken}`)
				.expect(HttpStatus.NOT_FOUND);
		});
	});
});
