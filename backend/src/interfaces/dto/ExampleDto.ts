import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class GreetingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8, { message: 'Name must not exceed 8 characters' })
  name: string;
}
