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
import { extname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { appConfig } from '../config/app.config';

const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
]);

function getSafeFilename(file: { originalname?: string; mimetype?: string }) {
  const mimetype = (file.mimetype || '').toLowerCase();
  const expectedExtension = ALLOWED_IMAGE_TYPES.get(mimetype);

  if (!expectedExtension) {
    throw new BadRequestException('Only JPG, PNG, GIF, and WEBP image files are allowed');
  }

  const providedExtension = extname(file.originalname || '').toLowerCase();
  if (
    providedExtension &&
    providedExtension !== expectedExtension &&
    !(mimetype === 'image/jpeg' && providedExtension === '.jpeg')
  ) {
    throw new BadRequestException('File extension does not match MIME type');
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `product-${uniqueSuffix}${expectedExtension}`;
}

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

  private resolveUploadPath(filename: string) {
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
      throw new BadRequestException('Invalid filename');
    }

    const filePath = resolve(this.uploadDir, filename);
    const uploadRoot = `${resolve(this.uploadDir)}${process.platform === 'win32' ? '\\' : '/'}`;
    if (!filePath.startsWith(uploadRoot)) {
      throw new BadRequestException('Invalid filename');
    }

    return filePath;
  }

  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'OPERATOR')
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
          try {
            cb(null, getSafeFilename(file));
          } catch (error) {
            cb(error as Error, '');
          }
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (req, file, cb) => {
        const mimetype = (file.mimetype || '').toLowerCase();
        if (!ALLOWED_IMAGE_TYPES.has(mimetype)) {
          return cb(new BadRequestException('Only JPG, PNG, GIF, and WEBP image files are allowed'), false);
        }

        const extension = extname(file.originalname || '').toLowerCase();
        const expectedExtension = ALLOWED_IMAGE_TYPES.get(mimetype);
        if (
          extension &&
          expectedExtension &&
          extension !== expectedExtension &&
          !(mimetype === 'image/jpeg' && extension === '.jpeg')
        ) {
          return cb(new BadRequestException('File extension does not match MIME type'), false);
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
    const filePath = this.resolveUploadPath(filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    return res.sendFile(filePath);
  }
}
