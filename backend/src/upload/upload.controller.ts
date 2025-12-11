import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Res,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { appConfig } from '../config/app.config';

@Controller('upload')
export class UploadController {
  private readonly uploadDir: string;

  constructor() {
    // Store uploads in backend/uploads directory (persistent on Render)
    this.uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads');
          if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          if (!file) {
            return cb(new BadRequestException('No file provided'), '');
          }
          // Generate unique filename: timestamp-random-originalname
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Return the absolute URL that will be served by the backend API
    const backendUrl = appConfig.backendUrl || process.env.BACKEND_URL || 'http://localhost:3000';
    const url = `${backendUrl}/api/upload/image/${file.filename}`;
    
    return {
      url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get('image/:filename')
  @Public()
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(this.uploadDir, filename);
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Send file with appropriate content type
    return res.sendFile(filePath);
  }
}

