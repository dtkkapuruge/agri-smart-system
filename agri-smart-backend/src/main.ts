import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Enable CORS for the Frontend
  app.enableCors();

  // 2. Enable Global Validation (important for DTOs)
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // 2. SETUP THE BACKEND INTERFACE (SWAGGER)
  const config = new DocumentBuilder()
    .setTitle('Agri-Smart API')
    .setDescription('The official backend interface for the Automated Visual Quality Grading and Geospatial Smart-Matching System.')
    .setVersion('1.0')
    .addTag('agri-smart')
    .addBearerAuth() // This adds the "Lock" icon so you can test with tokens
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); 

  // 3. Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`\n🚀 Agri-Smart Backend is ALIVE!`);
  console.log(`📄 Backend Interface (Interactive API): http://localhost:${port}/api`);
  console.log(`🛠️  Environment: ${process.env.NODE_ENV || 'development'}\n`);
}
bootstrap();
