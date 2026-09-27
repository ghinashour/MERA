import { Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  @Post()
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: diskStorage({ destination: './public', filename: (_r, f, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(f.originalname)}`) }),
    limits: { fileSize: 8 * 1024 * 1024 },
  }))
  upload(@UploadedFiles() files: Express.Multer.File[]) {
    return files.map((f) => ({ url: `/public/${f.filename}`, filename: f.filename }));
  }
}
