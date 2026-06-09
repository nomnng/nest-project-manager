import {
	BadRequestException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument } from "./user.schema";

@Injectable()
export class UsersService {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
	) {}

	async create(createUserDto: CreateUserDto): Promise<User> {
		const alreadyExists = await this.userModel
			.findOne({
				email: createUserDto.email,
			})
			.exec();

		if (alreadyExists) {
			throw new BadRequestException("User with this email already exists");
		}

		const newUser = new this.userModel(createUserDto);
		return newUser.save();
	}

	async findOne(id: string): Promise<User> {
		const user = await this.userModel.findById(id).exec();
		if (!user) {
			throw new NotFoundException("User not found");
		}
		return user;
	}

	async findOneByEmail(email: string): Promise<User> {
		const user = await this.userModel.findOne({ email }).exec();
		if (!user) {
			throw new NotFoundException("User not found");
		}
		return user;
	}
}
