import { Injectable } from '@nestjs/common';

@Injectable()
export class ExampleService {
  sayHello(name: string): string {
    return `Hello, ${name}`;
  }
}
