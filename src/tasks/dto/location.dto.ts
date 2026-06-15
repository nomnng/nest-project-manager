import {
	Equals,
	IsArray,
	ArrayMinSize,
	ArrayMaxSize,
	IsNumber,
} from "class-validator";

export class LocationDto {
	@Equals("Point", { message: "Location type must be 'Point'" })
	type: "Point";

	@IsArray({ message: "Coordinates must be an array" })
	@ArrayMinSize(2, {
		message: "Coordinates must contain longitude and latitude",
	})
	@ArrayMaxSize(2, {
		message: "Coordinates must contain only longitude and latitude",
	})
	@IsNumber({}, { each: true, message: "Each coordinate must be a number" })
	coordinates: [number, number];
}
