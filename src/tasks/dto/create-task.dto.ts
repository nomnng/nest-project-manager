export class CreateTaskDto {
	name: string;
	tags?: string[];
	deadline?: Date;
	description?: string;
}
