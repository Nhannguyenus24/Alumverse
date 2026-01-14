import { Controller, Post, Body } from '@nestjs/common';
import { ExampleService } from '../../application/ExampleService';
import { GreetingDto } from '../dto/ExampleDto';
import { ApiResponse } from '../dto/ApiResponse';

@Controller('example')
export class ExampleController {
  constructor(private readonly exampleService: ExampleService) {}

  @Post('greet')
  greet(@Body() greetingDto: GreetingDto): ApiResponse<{ greeting: string }> {
    const greeting = this.exampleService.sayHello(greetingDto.name);
    return new ApiResponse({ greeting }, 'Greeting generated successfully');
  }
}
