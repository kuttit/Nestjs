import { IsNotEmpty } from 'class-validator';

export class apiGenDto {
  @IsNotEmpty()
  key: string;
}
