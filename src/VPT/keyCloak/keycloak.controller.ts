import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';

@Controller('keycloak')
export class KeycloakController {
  constructor(private readonly keycloak: KeycloakService) {}
  @Get('allRealm')
  async getAllRealm() {
    return this.keycloak.getAllkeycloakRealms();
  }

  @Get('allClient/:realmId')
  async getClient(@Param('realmId') realmId: any) {

    return this.keycloak.getAllClientInRealms(realmId);
  }
  @Post('isActive')
  async checkExpire(@Body() data: any) {
    return this.keycloak.getisExpiredOrNot(data);
  }
  @Post('identityprovider')
  async postIdentityProvider(@Body() data:any) {
    const { user , account } = data;
    return this.keycloak.postIdentityProvider(user , account)
  }

  @Post('resetotp')
  async sendResetOtp(@Body() data:any){
    const { email , realmId } = data;
    return this.keycloak.sendResetOtp(email , realmId);
  }

  @Post('verifyPasswordOtp')
  async verifyPassOtp(@Body() data : any){
    const {email ,realmId , otp } = data;
    return this.keycloak.verifyPassOtp(email , realmId , otp)
  }

  
  @Post('changepassword')
  async changePassword(@Body() data : any){
    const {userId , password } = data;
    return this.keycloak.changePassword(userId , password);
  }

  @Post('sendVerificationOTP')
  async sendVerificationOTP(@Body() data : any){
    const { email } = data;
    return this.keycloak.sendVerificationOTP(email);
  }

  @Post('verifyMailId')
  async verifyMailId(@Body() data : any){
    const { email , otp } = data;
    return this.keycloak.verifyMailId(email , otp);
  }

  @Post('getAllKeys')
  async getAllKeys(@Body() data : any){
    const { keyPrefix } = data;
    return this.keycloak.getAllKeys(keyPrefix);
  }

}
