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
import { extname, join, basename, resolve, sep } from 'path';
import { existsSync, mkdirSync, unlinkSync, openSync, readSync, closeSync } from 'fs';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { appConfig } from '../config/app.config';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

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
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `product-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB
      },
      fileFilter: (req, file, cb) => {
        const extension = extname(file.originalname || '').toLowerCase();
        const isAllowedMime = ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype.toLowerCase());
        const isAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.has(extension);

        if (!isAllowedMime || !isAllowedExtension) {
          return cb(
            new BadRequestException('Only jpg, jpeg, png, gif, and webp image files are allowed'),
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

    const extension = extname(file.originalname || '').toLowerCase();
    if (!this.hasValidImageMagicBytes(file.path, extension)) {
      this.removeInvalidUpload(file.path);
      throw new BadRequestException('Invalid image file content');
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

  private hasValidImageMagicBytes(filePath: string, extension: string): boolean {
    const fd = openSync(filePath, 'r');
    const buffer = Buffer.alloc(16);

    try {
      const bytesRead = readSync(fd, buffer, 0, buffer.length, 0);
      if (bytesRead < 4) {
        return false;
      }

      if (extension === '.jpg' || extension === '.jpeg') {
        return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      }

      if (extension === '.png') {
        return (
          bytesRead >= 8 &&
          buffer[0] === 0x89 &&
          buffer[1] === 0x50 &&
          buffer[2] === 0x4e &&
          buffer[3] === 0x47 &&
          buffer[4] === 0x0d &&
          buffer[5] === 0x0a &&
          buffer[6] === 0x1a &&
          buffer[7] === 0x0a
        );
      }

      if (extension === '.gif') {
        return (
          bytesRead >= 6 &&
          buffer[0] === 0x47 &&
          buffer[1] === 0x49 &&
          buffer[2] === 0x46 &&
          buffer[3] === 0x38 &&
          (buffer[4] === 0x37 || buffer[4] === 0x39) &&
          buffer[5] === 0x61
        );
      }

      if (extension === '.webp') {
        return (
          bytesRead >= 12 &&
          buffer[0] === 0x52 &&
          buffer[1] === 0x49 &&
          buffer[2] === 0x46 &&
          buffer[3] === 0x46 &&
          buffer[8] === 0x57 &&
          buffer[9] === 0x45 &&
          buffer[10] === 0x42 &&
          buffer[11] === 0x50
        );
      }

      return false;
    } finally {
      closeSync(fd);
    }
  }

  private removeInvalidUpload(filePath: string): void {
    try {
      if (filePath && existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {
      // Best-effort cleanup only.
    }
  }

  @Get('image/:filename')
  @Public()
  async getImage(@Param('filename') filename: string, @Res() res: Response) {
    const normalizedFilename = (filename || '').trim();
    const isSafeFilename =
      normalizedFilename.length > 0 &&
      normalizedFilename.length <= 255 &&
      normalizedFilename === basename(normalizedFilename) &&
      /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(normalizedFilename);

    if (!isSafeFilename) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    const resolvedUploadDir = resolve(this.uploadDir);
    const filePath = resolve(resolvedUploadDir, normalizedFilename);
    if (!filePath.startsWith(`${resolvedUploadDir}${sep}`)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Send file with appropriate content type
    return res.sendFile(filePath);
  }
}
