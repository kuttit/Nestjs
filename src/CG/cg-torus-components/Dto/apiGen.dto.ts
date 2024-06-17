import { IsNotEmpty } from 'class-validator';

export class torusComponentGenDto {
  @IsNotEmpty()
  key: string;
}
