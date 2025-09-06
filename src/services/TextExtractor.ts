import fs from 'fs/promises';
import { logger } from '../utils/logger';

// Simplified text extraction for MVP
export class TextExtractor {
  
  async extractText(filePath: string, contentType: string): Promise<string> {
    try {
      logger.info('Starting text extraction', { filePath, contentType });

      switch (contentType) {
        case 'text/plain':
        case 'text/csv':
          return await this.extractTextFile(filePath);
        
        case 'application/pdf':
          return await this.extractPDF(filePath);
        
        case 'image/png':
        case 'image/jpeg':
          // For MVP, we'll skip OCR and return placeholder
          logger.warn('OCR not implemented in MVP', { contentType });
          return 'Image content - OCR processing not available in MVP version';
        
        default:
          logger.warn('Unsupported content type for extraction', { contentType });
          return 'Unsupported file type for text extraction';
      }

    } catch (error: any) {
      logger.error('Text extraction failed', {
        filePath,
        contentType,
        error: error.message
      });
      throw new Error(`Text extraction failed: ${error.message}`);
    }
  }

  private async extractTextFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim();
  }

  private async extractPDF(filePath: string): Promise<string> {
    try {
      // Dynamic import for pdf-parse (ES modules compatibility)
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      
      logger.info('PDF extraction successful', {
        pages: data.numpages,
        textLength: data.text.length
      });

      return data.text.trim();

    } catch (error: any) {
      logger.error('PDF extraction failed', { error: error.message });
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  // Simple text chunking for MVP
  chunkText(text: string, maxTokens: number = 1000): string[] {
    // Simple word-based chunking (not token-accurate but good for MVP)
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxTokens) {
      const chunk = words.slice(i, i + maxTokens).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }

    return chunks.length > 0 ? chunks : [text];
  }
}