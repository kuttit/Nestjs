import { CanActivate, ExecutionContext,Injectable, Logger } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';
import { CommonService } from "src/commonService";


declare module 'express-session' {
  interface Session {
    psArray: Array<any>;
  }
}
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
     
  var token:any = this.jwtService.decode(request.session.sToken,{ json: true });
  var sjsoncheck = await this.commonService.getSecurityJson(request.body.sfkey,token)
  request.session.psArray = sjsoncheck
 
  if(Array.isArray(sjsoncheck)){
    if(sjsoncheck.length > 0){
      return true
    }  
  }  
 }
}