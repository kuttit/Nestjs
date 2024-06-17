import { BadRequestException } from '@nestjs/common';

import { Request } from 'express';
export const fileNameEditor = (
  req: Request,
  file: any,
  callback: (error: any, filename) => void,
) => {
  var ext = req.headers.name + '.' + file.originalname.split('.').pop();
  callback(null, ext);
};

export const imageFileFilter = (
  req: Request,
  file: any,
  callback: (error: any, valid: boolean) => void,
) => {
  if (
    !file.originalname ||
    !file.originalname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)
  ) {
    return callback(
      new BadRequestException('File must be of type jpg|jpeg|png|gif|svg|webp'),
      false,
    );
  }
  callback(null, true);
};
