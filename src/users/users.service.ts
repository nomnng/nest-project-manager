import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./user.schema";
import { UserAlreadyExistsException } from "./errors/user-already-exists.exception";
import { UserNotFoundException } from "./errors/user-not-found.exception";

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
	) {}

	async create(email: string, passwordHash): Promise<User> {
		const alreadyExists = await this.userModel
			.findOne({
				email,
			})
			.exec();

		if (alreadyExists) {
			throw new UserAlreadyExistsException(email);
		}

		const newUser = new this.userModel({
			email,
			passwordHash,
		});
		return newUser.save();
	}

	async findOne(id: string): Promise<User> {
		const user = await this.userModel.findById(id).exec();
		if (!user) {
			throw new UserNotFoundException(id);
		}
		return user;
	}

	async findOneByEmail(email: string): Promise<User | null> {
		return await this.userModel.findOne({ email }).exec();
	}
}
