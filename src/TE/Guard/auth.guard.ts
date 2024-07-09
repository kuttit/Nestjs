import { CanActivate, ExecutionContext,Injectable } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { CommonService } from "src/commonService";

@Injectable()
export class AuthGuard implements CanActivate {
 constructor( private readonly commonService: CommonService,private readonly jwtService: JwtService) {}
 
 async canActivate(context: ExecutionContext): Promise<boolean>{
 const request = context.switchToHttp().getRequest();
 
 if(request.body.sflag){
   if(request.body.mode == 'D' && request.body.sflag == 'N'){
     return true
   }
 }
 
 var tokenhead: any = request.headers.authorization 
 var btoken = tokenhead.split(' ')[1];      
 var token:any = this.jwtService.decode(btoken,{ json: true }) ;

 var sjsoncheck = await this.commonService.getSecurityJson(request.body.sfkey,token)
 console.log('AuthGuard',sjsoncheck);
  if(Array.isArray(sjsoncheck)){
    if(sjsoncheck.length > 0){
      return true
    }  
  } 
 }
}