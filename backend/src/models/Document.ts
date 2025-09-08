import { db } from '../database.ts';

export interface Document {
  id: number;
  filename: string;
  content_type: string;
  size: number;
  file_path: string;
  status: string;
  uploaded_at: Date;
  extracted_text?: string | null;
  embedding_id?: string | null;
  processed_at?: Date | null;
  error_message?: string | null;
  chunk_count?: number | null;
  summary?: string | null;
  summary_generated_at?: Date | null;
}

export interface CreateDocumentDto {
  filename: string;
  content_type: string;
  size: number;
  file_path: string;
}

export class DocumentModel {
  private tableName = 'documents';

  async create(data: CreateDocumentDto): Promise<Document> {
    const [id] = await db(this.tableName).insert({
      ...data,
      status: 'uploaded',
      uploaded_at: new Date()
    });

    const document = await this.findById(id);
    if (!document) {
      throw new Error('Failed to create document');
    }
    return document;
  }

  async findById(id: number | string): Promise<Document | null> {
    const document = await db(this.tableName)
      .where('id', id)
      .first();
    
    return document || null;
  }

  async findAll(): Promise<Document[]> {
    return await db(this.tableName)
      .select('*')
      .orderBy('uploaded_at', 'desc');
  }

  async update(id: number | string, data: Partial<Document>): Promise<Document | null> {
    await db(this.tableName)
      .where('id', id)
      .update(data);
    
    return this.findById(id);
  }

  async delete(id: number | string): Promise<boolean> {
    const deleted = await db(this.tableName)
      .where('id', id)
      .delete();
    
    return deleted > 0;
  }
}

export default new DocumentModel();