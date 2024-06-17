import { IsNotEmpty } from 'class-validator';

export class erApiGenDto {
  @IsNotEmpty()
  key: string;
}
