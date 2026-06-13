import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import request from "supertest";
import { App } from "supertest/types";
import { Connection } from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { AppModule } from "./../src/app.module";

describe("AuthController (e2e)", () => {
	let app: INestApplication<App>;
	let mongod: MongoMemoryServer;

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
	});

	afterAll(async () => {
		await mongod.stop();
		await app.close();
	});

	beforeEach(async () => {
		const connection = app.get<Connection>(getConnectionToken());
		if (connection.db) {
			await connection.db.dropDatabase();
		}
	});

	describe("POST /auth/register", () => {
		it("registers a user with valid credentials", async () => {
			const response = await request(app.getHttpServer())
				.post("/auth/register")
				.send({ email: "user@example.com", password: "password123" })
				.expect(201);

			expect(response.body).toEqual({ message: "Registration successful" });
		});

		it("returns 400 when required fields are missing", async () => {
			const response = await request(app.getHttpServer())
				.post("/auth/register")
				.send({})
				.expect(400);

			expect(response.body.message).toEqual(
				expect.arrayContaining(["Email is required", "Password is required"]),
			);
		});

		it("returns 400 when registering with an existing email", async () => {
			const payload = { email: "user@example.com", password: "password123" };

			await request(app.getHttpServer())
				.post("/auth/register")
				.send(payload)
				.expect(201);

			const response = await request(app.getHttpServer())
				.post("/auth/register")
				.send(payload)
				.expect(400);

			expect(response.body.message).toBe("User with this email already exists");
		});
	});

	describe("POST /auth/login", () => {
		const credentials = {
			email: "user@example.com",
			password: "password123",
		};

		beforeEach(async () => {
			await request(app.getHttpServer())
				.post("/auth/register")
				.send(credentials)
				.expect(201);
		});

		it("returns a JWT when credentials are valid", async () => {
			const response = await request(app.getHttpServer())
				.post("/auth/login")
				.send(credentials)
				.expect(200);

			expect(response.body).toEqual({
				jwt: expect.any(String),
			});
			expect(response.body.jwt.length).toBeGreaterThan(0);
		});

		it("returns 401 when email is not found", async () => {
			const response = await request(app.getHttpServer())
				.post("/auth/login")
				.send({ email: "unknown@example.com", password: "password123" })
				.expect(401);

			expect(response.body.message).toBe("Invalid email or password");
		});

		it("returns 400 when required fields are missing", async () => {
			const response = await request(app.getHttpServer())
				.post("/auth/login")
				.send({})
				.expect(400);

			expect(response.body.message).toEqual(
				expect.arrayContaining(["Email is required", "Password is required"]),
			);
		});
	});
});
