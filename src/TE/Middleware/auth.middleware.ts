import { Injectable, Logger, NestMiddleware, NotAcceptableException, NotFoundException } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redisService';
 
@Injectable()
export class AuthMiddleware implements NestMiddleware { 
    constructor(private readonly redisService: RedisService,private readonly jwtService: JwtService) {}
    async use(req: Request, res: Response, next: NextFunction) {     
    
    var tokenhead: any = req.headers.authorization 
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
      Logger.log("Execution started...")
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