import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database.service';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import { RedisService } from 'src/redisService';
const Redis = require('ioredis');

const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com',
  port: 587,
  auth: {
    user: 'support@torus.tech',
    pass: 'Welcome@100',
  },
});

const redis = new Redis({
  host: process.env.HOST,
  port: parseInt(process.env.PORT),
});

@Injectable()
export class KeycloakService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}
  async getAllkeycloakRealms() {
    const sql = 'select id ,name from realm';
    const result = await this.dbService.query(sql);
    return result.rows;
  }
  async getAllClientInRealms(realmId) {
    try {
      const res = await this.dbService.query(
        `SELECT client_id, secret FROM client WHERE realm_id = $1 AND full_scope_allowed = $2`,
        [realmId, true],
      );
      return res.rows;
    } catch (err) {
      return 'error occured';
    }
  }

  async getisExpiredOrNot(Data) {
    const encodeFormData = (data) => {
      return Object.keys(data)
        .map(
          (key) =>
            encodeURIComponent(key) + '=' + encodeURIComponent(data[key]),
        )
        .join('&');
    };

    var checkisAciveUrl = `https://keycloak9x.gsstvl.com:18443/realms/${Data.realm}/protocol/openid-connect/token/introspect`;

    var maindata = {
      token: Data.token,
      client_id: Data.client_id,
      client_secret: Data.client_secret,
    };

    try {
      const res = await fetch(checkisAciveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: encodeFormData(maindata),
      })
        .then((res) => res.json())
        .then((res) => res);
      return res;
    } catch (err) {
      return 'error';
    }
  }

  async postIdentityProvider(user, account) {
    try {
      const timestamps = new Date().getTime();

      // Insert user table
      const userInsertQuery = `INSERT INTO user_entity  (id, username, email, email_constraint , created_timestamp , email_verified , realm_id , enabled )
            VALUES ($1, $2, $3, $4 , $5 , $6 , $7 , $8)`;
      const userParams = [
        user.id,
        user.name,
        user.email,
        user.email,
        timestamps,
        true,
        account?.realm_id ?? '783d6448-f852-435d-8c93-984211abe822',
        true,
      ];

      const userResult = await this.dbService.query(
        userInsertQuery,
        userParams,
      );

      //create federation_identity Table
      if (userResult.rowCount) {
        const federated_id_insert_query = `insert into federated_identity (identity_provider , realm_id , federated_user_id , user_id , token)
        VALUES ($1, $2, $3, $4 , $5)`;
        const federated_id_params = [
          account.provider,
          account?.realm_id ?? '783d6448-f852-435d-8c93-984211abe822',
          account.providerAccountId,
          user.id,
          account.access_token,
        ];

        const federated_id_result = await this.dbService.query(
          federated_id_insert_query,
          federated_id_params,
        );
        const user_role_result = await this.dbService.query(
          `insert into user_role_mapping (user_id , role_id) values ($1 , $2)`,
          [user.id, '9ae5692f-1813-4e76-8141-8ad3d826bba0'],
        );
      }

      return { data: 'success' };
    } catch (err) {
      return { error: 'Error occured' };
    }
  }

  async sendResetOtp(email, realmId) {
    try {
      const res = await this.dbService.query(
        `select * from user_entity where email =$1 and realm_id=$2`,
        [email, realmId],
      );

      if (!res.rows.length) {
        return { error: 'user not availabe' };
      } else {
        const userId = res.rows[0].id;
        const first_name = res?.rows[0]?.first_name;
        const last_name = res?.rows[0]?.last_name;
        const otp = Math.floor(100000 + Math.random() * 900000);
        await this.dbService.query(
          `CREATE TABLE IF NOT EXISTS public.otp (
              id SERIAL PRIMARY KEY,
              register_otp VARCHAR(255) NULL,
              reset_otp VARCHAR(255) NULL,
              user_id VARCHAR(255) NULL,
              email VARCHAR(255) NULL
          )`,
        );
        const createOTP = await this.dbService.query(
          `insert into otp (reset_otp , user_id) values ($1 , $2 )`,
          [otp, userId],
        );

        const responseFromRedis = await this.redisService.getJsonData(
          'emailTemplates:resetPasswordOtp',
        );
        const resetOtpTemplate = JSON.parse(responseFromRedis);

        const updatedTemplateText = (resetOtpTemplate.text as string)
          .replace('${name}', `${first_name ?? email} ${last_name ?? ''}`)
          .replace('${otp}', `${otp}`);

        const mailOptions = {
          from: 'support@torus.tech',
          to: email,
          subject: resetOtpTemplate.subject,
          text: updatedTemplateText,

          // `Dear ${first_name ?? email} ${last_name ?? ''},

          // Your Torus App password reset OTP is: ${otp}

          // Use it to reset your password. Let us know if you need help.

          // Best regards,
          // Torus Innovations`,
        };

        if (createOTP.rowCount) {
          const otp_id = await this.dbService.query(
            `select id from otp where reset_otp=$1`,
            [otp],
          );

          transporter.sendMail(mailOptions, async (error, info) => {
            if (error) {
              console.error(error);
              return { error: 'Not a valid email try with different mail' };
            } else {
              console.log('Email sent: ' + info.response);
              return { data: `Email sent`, otp_id: otp_id.rows?.[0].id };
            }
          });
          return { data: `Email sent` };
        } else {
          return { error: 'User Not available' };
        }
      }
    } catch (err) {
      return { error: 'Uncontrolled error occured' };
    }
  }

  async verifyPassOtp(email, realmId, otp) {
    try {
      const res = await this.dbService.query(
        `select * from user_entity where email =$1 and realm_id=$2`,
        [email, realmId],
      );

      if (!res.rows.length) {
        return { error: 'user not availabe' };
      } else {
        const userId = res.rows[0].id;
        const verifyOtp = await this.dbService.query(
          `select * from otp where user_id= $1 and reset_otp = $2`,
          [userId, otp],
        );
        if (verifyOtp.rows.length) {
          const deleteEntryFromDb = await this.dbService.query(
            `delete from otp where reset_otp=$1`,
            [otp],
          );

          return { data: `OTP verified successfully`, userId };
        } else {
          return { error: 'Otp invalid or expired' };
        }
      }
    } catch (err) {
      return { error: 'Uncontrolled Error occured' };
    }
  }

  async changePassword(userId, password) {
    try {
      const res = await this.dbService.query(
        `select secret_data from credential where user_id=$1`,
        [userId],
      );

      if (res.rowCount) {
        const oldpassword = JSON.parse(res.rows?.[0]?.secret_data);
        const { salt, value } = oldpassword;

        // Parameters for hashing
        const hashIterations = 210000; // Number of iterations
        const algorithm = 'sha512'; // Hashing algorithm

        // Decode the existing hashed password and salt
        const decodedValue = Buffer.from(value, 'base64');
        const decodedSalt = Buffer.from(salt, 'base64');

        // Hash the new password
        const newHash = crypto.pbkdf2Sync(
          password,
          decodedSalt,
          hashIterations,
          decodedValue.length,
          algorithm,
        );
        // Encode the new hashed password
        const newHashedPassword = newHash.toString('base64');

        const updatedPassword = { ...oldpassword, value: newHashedPassword };

        const updatePasswordInDB = await this.dbService.query(
          `update credential set secret_data=$1 where user_id=$2`,
          [JSON.stringify(updatedPassword), userId],
        );

        return { data: 'password updated' };
      } else {
        return { error: 'user not available ' };
      }
    } catch (err) {
      return { error: 'Uncontrolled Error occured' };
    }
  }

  async sendVerificationOTP(email) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000);
      await this.dbService.query(
        `CREATE TABLE IF NOT EXISTS public.otp (
            id SERIAL PRIMARY KEY,
            register_otp VARCHAR(255) NULL,
            reset_otp VARCHAR(255) NULL,
            user_id VARCHAR(255) NULL,
            email VARCHAR(255) NULL
        )`,
      );
      const createOTP = await this.dbService.query(
        `insert into otp (register_otp , email) values ($1 , $2 )`,
        [otp, email],
      );

      const responseFromRedis = await this.redisService.getJsonData(
        'emailTemplates:mailVerficationOtp',
      );
      const verificationTemplate = JSON.parse(responseFromRedis);
      const updatedTemplate = (verificationTemplate.text as string)
        .replace('${email}', email.split('@')[0])
        .replace('${otp}', `*${otp}*`);

      const mailOptions = {
        from: 'support@torus.tech',
        to: email,
        subject: verificationTemplate.subject,
        text: updatedTemplate,
        //` Hi ${email.split('@')[0]},

        // Your OTP for verifying your email on Torus App is: ${otp}

        // Please use it to complete the verification process. Let us know if you need assistance.

        // Best regards,
        // Torus Innovations`,
      };
      if (createOTP.rowCount && email) {
        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.error(error);
            return { error: 'Error occured' };
          } else {
            console.log('Email sent: ' + info.response);
            return { data: `Email sent` };
          }
        });
        return { data: `Email sent` };
      } else {
        return { error: 'Invalid email or email already registered' };
      }
    } catch (err) {
      return { error: 'Uncontrolled error occured' };
    }
  }

  async verifyMailId(email, otp) {
    try {
      const isMailvalidQuery = await this.dbService.query(
        `select * from otp where email=$1 and register_otp =$2`,
        [email, otp],
      );
      if (isMailvalidQuery.rowCount) {
        const deleteEntryFromDb = await this.dbService.query(
          `delete from otp where register_otp=$1`,
          [otp],
        );

        return { data: `Email verified successfully` };
      } else {
        return { error: `Invalid Otp or OTP expired` };
      }
    } catch (err) {
      return { error: 'Uncontrolled Error occured' };
    }
  }

  async getAllKeys(keyPrefix) {
    try {
      const keys = await redis.keys(keyPrefix + ':*');
      if (keys && keys.length) {
        return { data: keys };
      } else {
        return { error: 'No data available for the key' };
      }
    } catch {
      return { error: 'Uncontrolled Error occured' };
    }
  }
}
