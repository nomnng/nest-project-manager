import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const config = new DocumentBuilder()
		.setTitle("API docs")
		.setVersion("1.0")
		.addBearerAuth(
			{
			  type: 'http',
			  scheme: 'bearer',
			  bearerFormat: 'JWT',
			  name: 'JWT',
			  description: 'Enter JWT token',
			  in: 'header',
			},
			'JWT-auth',
		  )
		.build();
	const documentFactory = () => SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, documentFactory);

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
