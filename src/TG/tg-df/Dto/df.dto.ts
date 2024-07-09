import { IsNotEmpty } from 'class-validator';

export class DFGenDto {
  @IsNotEmpty()
  key: string;
}
