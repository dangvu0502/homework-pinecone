import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class FileStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'src', 'uploads');
  }

  async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<{ filePath: string; fileKey: string }> {
    await this.ensureUploadDir();
    
    const fileExtension = path.extname(file.originalname);
    const fileKey = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, fileKey);
    
    await fs.writeFile(filePath, file.buffer);
    
    return {
      filePath: `/src/uploads/${fileKey}`,
      fileKey
    };
  }

  async deleteFile(fileKey: string): Promise<void> {
    const filePath = path.join(this.uploadDir, fileKey);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${fileKey}:`, error);
    }
  }

  async getFile(fileKey: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, fileKey);
    return await fs.readFile(filePath);
  }
}

export default new FileStorageService();