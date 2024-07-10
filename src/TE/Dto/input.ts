import { ApiProperty } from "@nestjs/swagger";


export class Input {

    name: string;
    @ApiProperty({ description: 'Security Key', example: 'ABC:MSP:ME:SF:bankmaster:v3' })
    sfkey: string;
  
    @ApiProperty({ description: 'Process Key', example: 'ABC:MSP:ME:PF:bankmaster:v3:' })
    key: string;
    
    @ApiProperty({ description: 'Mode', example: 'E' })
    mode: string;

    @ApiProperty({ description: 'token', example: '' })
    token?: string;    
  
    @ApiProperty({ description: 'Security Flag', example: 'Y', required: false })
    sflag?: string;

    upId?:string;
    
  }