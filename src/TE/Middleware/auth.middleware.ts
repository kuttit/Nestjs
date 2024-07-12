import { Injectable, NestMiddleware, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redisService';
import * as session from 'express-session';
declare module 'express-session' {
  interface Session {
    sToken: any;
  }
}
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly redisService: RedisService,private readonly jwtService: JwtService) {}
  async use(req: Request, res: Response, next: NextFunction) {    
    console.log(req.ip);
   
    var tokenhead: any = req.headers.authorization.split(' ')[1];    
    req.session.sToken = tokenhead;
 
    if(!tokenhead){
      throw new NotAcceptableException('token not found')
    }
 
    if(!req.body.key && !req.body.sfkey){
      throw new NotFoundException('Process Key and Security Key not found')
    }
    else if(!req.body.key){
      throw new NotFoundException('Process Key not found')
    }
    else if(!req.body.sfkey){
      throw new NotFoundException('Security Key not found')
    }
    var availablesfkey = JSON.parse(await this.redisService.getJsonData(req.body.sfkey+':summary'))
       
    if(availablesfkey != null){
    if(Object.keys(availablesfkey).length>0){
      console.log("Execution started...")
      next()
    }
    else{
      throw new NotFoundException('Given Security json is empty in Redis')
    }
    }else{
      throw new NotFoundException('Given Security Key is not found in Redis')
    }
  }
}