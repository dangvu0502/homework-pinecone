import { db } from '../database.ts';

export interface ChatSession {
  id: number;
  user_id?: number;
  document_ids: number[];
  created_at: Date;
}

export interface CreateChatSessionDto {
  user_id?: number;
  document_ids?: number[];
}

export class ChatSessionModel {
  private tableName = 'chat_sessions';

  async create(data: CreateChatSessionDto = {}): Promise<ChatSession> {
    const [id] = await db(this.tableName).insert({
      user_id: data.user_id || null,
      document_ids: JSON.stringify(data.document_ids || []),
      created_at: new Date()
    });

    const session = await this.findById(id);
    if (!session) {
      throw new Error('Failed to create chat session');
    }
    return session;
  }

  async findById(id: number | string): Promise<ChatSession | null> {
    const session = await db(this.tableName)
      .where('id', id)
      .first();
    
    if (!session) return null;
    
    return {
      ...session,
      document_ids: typeof session.document_ids === 'string' 
        ? JSON.parse(session.document_ids) 
        : session.document_ids
    };
  }

  async findAll(userId?: number): Promise<ChatSession[]> {
    let query = db(this.tableName).select('*').orderBy('created_at', 'desc');
    
    if (userId) {
      query = query.where('user_id', userId);
    }
    
    const sessions = await query;
    
    return sessions.map(session => ({
      ...session,
      document_ids: typeof session.document_ids === 'string' 
        ? JSON.parse(session.document_ids) 
        : session.document_ids
    }));
  }

  async update(id: number | string, data: Partial<ChatSession>): Promise<ChatSession | null> {
    const updateData: Partial<Omit<ChatSession, 'document_ids'>> & { document_ids?: string } = {
      id: data.id,
      user_id: data.user_id,
      created_at: data.created_at
    };
    
    if (data.document_ids) {
      updateData.document_ids = JSON.stringify(data.document_ids);
    }
    
    await db(this.tableName)
      .where('id', id)
      .update(updateData);
    
    return this.findById(id);
  }

  async delete(id: number | string): Promise<boolean> {
    const deleted = await db(this.tableName)
      .where('id', id)
      .delete();
    
    return deleted > 0;
  }
}

export default new ChatSessionModel();