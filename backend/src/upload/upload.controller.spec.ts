import { UploadController } from './upload.controller';

describe('UploadController', () => {
  let controller: UploadController;

  beforeEach(() => {
    controller = new UploadController();
  });

  it('should block path traversal filename in getImage', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      sendFile: jest.fn(),
    } as any;

    await controller.getImage('../secrets.txt', res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid filename' });
    expect(res.sendFile).not.toHaveBeenCalled();
  });
});
