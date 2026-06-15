import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { NotFoundException } from "@nestjs/common";
import { Model, Types } from "mongoose";
import { CommentsService } from "./comments.service";
import { Comment, CommentDocument } from "./comment.schema";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";

const taskId = "507f1f77bcf86cd799439012";
const commentId = "507f1f77bcf86cd799439013";
const authorId = "507f1f77bcf86cd799439014";

describe("CommentsService", () => {
	let service: CommentsService;
	let model: Model<CommentDocument>;

	const mockModelFactory = () => {
		const mockQuery = {
			exec: jest.fn(),
		};

		const modelMock: any = jest.fn().mockImplementation((dto) => ({
			...dto,
			save: jest.fn().mockResolvedValue({ _id: commentId, ...dto }),
		}));

		modelMock.find = jest.fn().mockReturnValue(mockQuery);
		modelMock.findById = jest.fn().mockReturnValue(mockQuery);
		modelMock.findByIdAndDelete = jest.fn().mockReturnValue(mockQuery);

		return modelMock;
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				CommentsService,
				{
					provide: getModelToken(Comment.name),
					useFactory: mockModelFactory,
				},
			],
		}).compile();

		service = module.get<CommentsService>(CommentsService);
		model = module.get<Model<CommentDocument>>(getModelToken(Comment.name));
	});

	it("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("create", () => {
		it("should successfully create and return a comment", async () => {
			const createCommentDto: CreateCommentDto = {
				content: "Test comment",
			};

			const result = await service.create(taskId, authorId, createCommentDto);

			expect(model).toHaveBeenCalledWith({
				...createCommentDto,
				taskId,
				authorId,
			});
			expect(result).toHaveProperty("_id", commentId);
			expect(result.content).toBe("Test comment");
		});
	});

	describe("findAll", () => {
		it("should return comments filtered by taskId", async () => {
			const mockComments = [{ content: "Comment 1" }, { content: "Comment 2" }];
			const mockQuery = model.find({ taskId });
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockComments);

			const result = await service.findAll(taskId);

			expect(model.find).toHaveBeenCalledWith({
				taskId: new Types.ObjectId(taskId),
			});
			expect(result).toEqual(mockComments);
		});
	});

	describe("findOne", () => {
		it("should return a comment if found", async () => {
			const mockComment = { _id: commentId, content: "Found comment" };
			const mockQuery = model.findById(commentId);
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockComment);

			const result = await service.findOne(commentId);

			expect(model.findById).toHaveBeenCalledWith(commentId);
			expect(result).toEqual(mockComment);
		});

		it("should throw NotFoundException if comment does not exist", async () => {
			const mockQuery = model.findById("invalid-id");
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(service.findOne("invalid-id")).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe("update", () => {
		it("should update and return the comment", async () => {
			const updateDto: UpdateCommentDto = { content: "Updated content" };
			const updatedComment = { _id: commentId, content: "Updated content" };
			const mockSave = jest.fn().mockResolvedValue(updatedComment);
			const mockComment = {
				_id: commentId,
				set: jest.fn(),
				save: mockSave,
			};
			const mockQuery = model.findById(commentId);
			(mockQuery.exec as jest.Mock).mockResolvedValue(mockComment);

			const result = await service.update(commentId, updateDto);

			expect(model.findById).toHaveBeenCalledWith(commentId);
			expect(mockComment.set).toHaveBeenCalledWith(updateDto);
			expect(mockSave).toHaveBeenCalled();
			expect(result).toEqual(updatedComment);
		});

		it("should throw NotFoundException if comment to update does not exist", async () => {
			const mockQuery = model.findById("invalid-id");
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(
				service.update("invalid-id", { content: "New" }),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe("remove", () => {
		it("should delete the comment successfully", async () => {
			const mockQuery = model.findById(commentId);
			(mockQuery.exec as jest.Mock).mockResolvedValue({ _id: commentId });

			const deleteExec = jest.fn().mockResolvedValue({ deletedCount: 1 });
			(model.findByIdAndDelete as jest.Mock).mockReturnValue({
				exec: deleteExec,
			});

			await expect(service.remove(commentId)).resolves.not.toThrow();
			expect(model.findById).toHaveBeenCalledWith(commentId);
			expect(model.findByIdAndDelete).toHaveBeenCalledWith(commentId);
		});

		it("should throw NotFoundException if comment to delete does not exist", async () => {
			const mockQuery = model.findById("invalid-id");
			(mockQuery.exec as jest.Mock).mockResolvedValue(null);

			await expect(service.remove("invalid-id")).rejects.toThrow(
				NotFoundException,
			);
		});
	});
});
