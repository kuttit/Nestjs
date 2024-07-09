import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CustomException } from "../customException";

@Controller("tp/auth")
export class AuthController {
  constructor(private readonly authservice: AuthService) {}
  @Post("sendVerificationOTP")
  async sendVerificationOTP(@Body() body: any) {
    const { client, email, type } = body;
    return this.authservice.sendVerificationOTP(client, email, type);
  }

  @Post("verifyMailId")
  async verifyMailId(@Body() body: any) {
    const { client, email, otp, type } = body;
    return this.authservice.verifyMailId(client, email, otp, type);
  }

  @Post("resetotp")
  async sendResetOtp(@Body() body: any) {
    const { client, email, type } = body;
    return this.authservice.sendResetOtp(client, email, type);
  }

  @Post("verifyPasswordOtp")
  async verifyPassOtp(@Body() body: any) {
    const { client, email, otp, type } = body;
    return this.authservice.verifyMailId(client, email, otp, type);
  }

  @Post("changepassword")
  async changePassword(@Body() body: any) {
    const { client, username, password, type } = body;
    return this.authservice.changePassword(client, username, password, type);
  }

  @Post("identityprovider")
  async postIdentityProvider(@Body() body: any) {
    const { client, role, user, account } = body;
    return this.authservice.postIdentityProvider(client, role, user, account);
  }

  @Post("checkIsExpire")
  async checkIsExpire(@Req() req: Request) {
    const { authorization }: any = req.headers;
    if (authorization) {
      const token = authorization.split(" ")[1];
      return this.authservice.checkIsExpire(token);
    } else {
      throw new CustomException("Token not found", HttpStatus.UNAUTHORIZED);
    }
  }
}
