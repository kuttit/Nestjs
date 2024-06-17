import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FILE_UPLOADS_DIR } from './constants';
import { fileNameEditor, imageFileFilter } from './upload.utils';
import { diskStorage } from 'multer';
const fs = require('fs').promises;

// import { promises as fs } from 'fs';
import { join } from 'path';
@Controller('file')
export class UploadController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        filename: fileNameEditor,
        destination: FILE_UPLOADS_DIR,
      }),
      limits: {
        fileSize: 1000 * 1000 * 1,
      },
      fileFilter: imageFileFilter,
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: 'http://localhost:3002/uploads/' + file.filename,
    };
  }

  @Delete('delete/:file')
  async delete(@Param('file') file: string): Promise<string> {
    const filePath = join(process.cwd(), 'uploads', file); // Using join for cross-platform compatibility

    try {
      await fs.unlink(filePath);
      return 'File deleted successfully';
    } catch (err) {
      return "File doesn't exist";
    }
  }
}
