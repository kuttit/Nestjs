import { IsNotEmpty } from 'class-validator';

export class TgUfGenDto {
  @IsNotEmpty()
  key: string;
}
