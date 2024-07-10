import { HttpStatus, Injectable, Scope } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { RedisService } from "src/redisService";
import {
  BadRequestException,
  CustomException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "../customException";
import { hashPassword } from "./hashing.utility";
import { JwtService } from "@nestjs/jwt";

const transporter = nodemailer.createTransport({
  host: "smtp-mail.outlook.com",
  port: 587,
  auth: {
    user: "support@torus.tech",
    pass: "Welcome@100",
  },
});

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService
  ) {}

  async throwCustomException(error: any) {
    if (error instanceof CustomException) {
      throw error; // Re-throw the specific custom exception
    }
    throw new CustomException(
      "An unexpected error occurred",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  async sendVerificationOTP(client: string, email: string, type: string = "t") {
    try {
      if (client && email) {
        const userListJson = await this.redisService.getJsonData(
          `${type.toUpperCase()}:${client}:users`
        );
        if (userListJson) {
          const userList = JSON.parse(userListJson);
          const existingUser = userList.find((ele: any) => ele.email == email);
          if (existingUser) {
            throw new ForbiddenException(
              "Email already registered , please provide another email or signin to your account"
            );
          }
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpJsonFromRedis = await this.redisService.getJsonData(
          `${type.toUpperCase()}:${client}:otp`
        );

        var otpJson = [];

        if (otpJsonFromRedis) {
          otpJson = JSON.parse(otpJsonFromRedis);
          const existingIndex = otpJson.findIndex((ele) => ele.email == email);
          if (existingIndex != -1) {
            otpJson.splice(existingIndex, 1, { email, otp });
          } else {
            otpJson.push({ email, otp });
          }
        } else {
          otpJson.push({ email, otp });
        }
        await this.redisService.setJsonData(
          `${type.toUpperCase()}:${client}:otp`,
          JSON.stringify(otpJson)
        );

        const responseFromRedis = await this.redisService.getJsonData(
          "emailTemplates:mailVerficationOtp"
        );
        const verificationTemplate = JSON.parse(responseFromRedis);
        const updatedTemplate = (verificationTemplate.text as string)
          .replace("${email}", email.split("@")[0])
          .replace("${otp}", `${otp}`);

        const mailOptions = {
          from: "support@torus.tech",
          to: email,
          subject: verificationTemplate.subject,
          text: updatedTemplate,
        };
        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            throw new ForbiddenException("Please check email is correct");
          } else {
            console.log("Email sent: " + info.response);
            return `Email sent`;
          }
        });
        return `Email sent`;
      } else {
        throw new BadRequestException("Please provide client and email value");
      }
    } catch (error) {
      await this.throwCustomException(error);
    }
  }

  async verifyMailId(
    client: string,
    email: string,
    otp: string,
    type: string = "t"
  ) {
    try {
      if (client && email && otp) {
        const otpJsonFromRedis = await this.redisService.getJsonData(
          `${type.toUpperCase()}:${client}:otp`
        );
        if (otpJsonFromRedis) {
          const otpJson = JSON.parse(otpJsonFromRedis);
          const existingIndex = otpJson.findIndex((ele: any, index: number) => {
            if (ele.email == email && ele.otp == otp) {
              return ele;
            }
          });

          if (existingIndex != -1) {
            otpJson.splice(existingIndex, 1);
            await this.redisService.setJsonData(
              `${type.toUpperCase()}:${client}:otp`,
              JSON.stringify(otpJson)
            );
            return `Email verified successfully`;
          } else {
            throw new NotFoundException(
              "No data found , Please check credentials"
            );
          }
        } else {
          throw new NotFoundException(
            "No data found , Please check credentials"
          );
        }
      } else {
        throw new BadRequestException("Please provide email and otp value");
      }
    } catch (error) {
      await this.throwCustomException(error);
    }
  }

  async sendResetOtp(client: string, email: string, type: string = "t") {
    try {
      if (client && email) {
        const userListJson = await this.redisService.getJsonData(
          `${type.toUpperCase()}:${client}:users`
        );
        if (userListJson) {
          const userList = JSON.parse(userListJson);
          const user = userList.find((ele: any) => ele.email == email);

          if (user) {
            const otp = Math.floor(100000 + Math.random() * 900000);
            const otpJsonFromRedis = await this.redisService.getJsonData(
              `${type.toUpperCase()}:${client}:otp`
            );

            var otpJson = [];

            if (otpJsonFromRedis) {
              otpJson = JSON.parse(otpJsonFromRedis);
              const existingIndex = otpJson.findIndex(
                (ele) => ele.email == email
              );
              if (existingIndex != -1) {
                otpJson.splice(existingIndex, 1, { email, otp });
              } else {
                otpJson.push({ email, otp });
              }
            } else {
              otpJson.push({ email, otp });
            }
            await this.redisService.setJsonData(
              `${type.toUpperCase()}:${client}:otp`,
              JSON.stringify(otpJson)
            );

            const responseFromRedis = await this.redisService.getJsonData(
              "emailTemplates:resetPasswordOtp"
            );
            const resetOtpTemplate = JSON.parse(responseFromRedis);
            const updatedTemplateText = (resetOtpTemplate.text as string)
              .replace(
                "${name}",
                `${user.firstname ?? email} ${user.lastname ?? ""}`
              )
              .replace("${otp}", `${otp}`);

            const mailOptions = {
              from: "support@torus.tech",
              to: email,
              subject: resetOtpTemplate.subject,
              text: updatedTemplateText,
            };

            transporter.sendMail(mailOptions, async (error, info) => {
              if (error) {
                throw new ForbiddenException(
                  "There is an issue with sending otp"
                );
              } else {
                console.log("Email sent: " + info.response);
                return `Email sent`;
              }
            });
            return `Email sent`;
          } else {
            throw new NotFoundException("User not exists");
          }
        } else {
          throw new NotFoundException("There is No data available");
        }
      } else {
        throw new BadRequestException("Please Provide all the credentials");
      }
    } catch (error) {
      await this.throwCustomException(error);
    }
  }

  async changePassword(
    client: string,
    username: string,
    password: string,
    type: string = "t"
  ) {
    try {
      if (client && username && password) {
        const userListJson = await this.redisService.getJsonData(
          `${type.toUpperCase()}:${client}:users`
        );
        if (userListJson) {
          const userList: any[] = JSON.parse(userListJson);
          const userIndex = userList.findIndex((ele: any) => {
            if (ele.loginId == username || ele.email == username) {
              return ele;
            }
          });
          if (userIndex != -1) {
            const updatedUserCredentials = {
              ...userList[userIndex],
              password: hashPassword(password),
            };
            userList.splice(userIndex, 1, updatedUserCredentials);
            return await this.redisService.setJsonData(
              `${type.toUpperCase()}:${client}:users`,
              JSON.stringify(userList)
            );
          } else {
            throw new BadRequestException(
              "User not available , Please check credentials"
            );
          }
        } else {
          throw new NotFoundException("There is No data available");
        }
      } else {
        throw new BadRequestException(
          "Please Provide all the necessary credentials"
        );
      }
    } catch (error) {
      await this.throwCustomException(error);
    }
  }

  async postIdentityProvider(
    client: string,
    role: string,
    user: any,
    account: any
  ) {
    try {
      if (client && user && account) {
        const userListJson = await this.redisService.getJsonData(
          `C:${client}:users`
        );
        var userList = [];
        const newUser = {
          loginId: user.name ?? "",
          firstName: user.name ?? "",
          lastName: "",
          email: user.email ?? "",
          mobile: "",
          password: "",
          "2FAFlag": "N",
          image: user.image,
          scope: account?.provider
            ? `${account?.provider} user`
            : `Social user`,
        };

        if (userListJson) {
          userList = JSON.parse(userListJson);
          const existingUserIndex = userList.findIndex((ele: any) => {
            if (ele.loginId == newUser.loginId || ele.email == newUser.email) {
              return ele;
            }
          });
          if (existingUserIndex != -1) {
            userList.splice(existingUserIndex, 1, {
              ...userList[existingUserIndex],
              image: newUser.image,
              scope: newUser.scope,
            });
          } else {
            userList.push(newUser);
          }
        } else {
          userList.push(newUser);
        }
        return await this.redisService.setJsonData(
          `C:${client}:users`,
          JSON.stringify(userList)
        );
      } else {
        throw new BadRequestException("Not enough data to continue");
      }
    } catch (error) {
      await this.throwCustomException(error);
    }
  }

  async refreshToken(token: string): Promise<string> {
    // Verify if the token is valid and not blacklisted
    const payload = await this.jwtService.verify(token);
    if (!payload) {
      throw new UnauthorizedException("Invalid token");
    }
    // Generate a new token with extended expiration
    const newToken = await this.jwtService.sign(payload, { expiresIn: "1h" });

    return newToken;
  }

  async checkIsExpire(token: string) {
    try {
      const decoded = this.jwtService.decode(token);
      if (!decoded || typeof decoded.exp === "undefined") {
        return true;
      }
      const expirationDate = new Date(decoded.exp * 1000);
      return expirationDate < new Date();
    } catch (error) {
      await this.throwCustomException(error);
    }
  }
}
