import { BadRequestException } from '@nestjs/common';
import { UploadController } from './upload.controller';

describe('UploadController', () => {
  let controller: UploadController;

  beforeEach(() => {
    controller = new UploadController();
  });

  it('rejects path traversal in image lookup', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendFile: jest.fn(),
    } as any;

    await expect(controller.getImage('../secret.txt', res)).rejects.toBeInstanceOf(BadRequestException);
    expect(res.sendFile).not.toHaveBeenCalled();
  });

  it('returns metadata for accepted uploads', async () => {
    const result = await controller.uploadImage({
      filename: 'product-1.png',
      size: 1234,
      mimetype: 'image/png',
    });

    expect(result).toEqual({
      url: expect.stringContaining('/api/upload/image/product-1.png'),
      filename: 'product-1.png',
      size: 1234,
      mimetype: 'image/png',
    });
  });
});
