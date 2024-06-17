import { IsDefined, IsString } from 'class-validator';

export class QueryDto {
    @IsString()
    @IsDefined()
    version: string;
}

export class PathDto {
    @IsString()
    @IsDefined()
    version: string;
}