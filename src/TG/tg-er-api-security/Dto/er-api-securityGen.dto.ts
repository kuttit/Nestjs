import { IsNotEmpty } from 'class-validator';

export class erApiSecurityGenDto {
  @IsNotEmpty()
  key: string;
}
