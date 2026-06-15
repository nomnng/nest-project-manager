import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { Comment, CommentDocument } from "./comment.schema";

@Injectable()
export class CommentsService {
	constructor(
		@InjectModel(Comment.name)
		private readonly commentModel: Model<CommentDocument>,
	) {}

	async create(
		taskId: string,
		authorId: string,
		createCommentDto: CreateCommentDto,
	): Promise<Comment> {
		const comment = new this.commentModel({
			...createCommentDto,
			taskId,
			authorId,
		});
		return comment.save();
	}

	async findAll(taskId: string): Promise<Comment[]> {
		return this.commentModel
			.find({ taskId: new Types.ObjectId(taskId) })
			.exec();
	}

	async findOne(id: string): Promise<Comment> {
		const comment = await this.commentModel.findById(id).exec();
		if (!comment) {
			throw new NotFoundException("Comment not found");
		}
		return comment;
	}

	async update(
		id: string,
		updateCommentDto: UpdateCommentDto,
	): Promise<Comment> {
		const comment = await this.commentModel.findById(id).exec();
		if (!comment) {
			throw new NotFoundException("Comment not found");
		}

		comment.set(updateCommentDto);
		return comment.save();
	}

	async remove(id: string): Promise<void> {
		const comment = await this.commentModel.findById(id).exec();
		if (!comment) {
			throw new NotFoundException("Comment not found");
		}

		await this.commentModel.findByIdAndDelete(id).exec();
	}
}
