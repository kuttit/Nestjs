import { Module } from "@nestjs/common";
import { RedisService } from "src/redisService";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtService } from "@nestjs/jwt";

@Module({
  controllers: [AuthController],
  providers: [AuthService, RedisService, JwtService],
})
export class AuthModule {}
