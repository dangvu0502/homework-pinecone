import { db } from '../config/database.js';

export interface ChatMessage {
  id: number;
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources: any[];
  created_at: Date;
}

export interface CreateChatMessageDto {
  session_id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

export class ChatMessageModel {
  private tableName = 'chat_messages';

  async create(data: CreateChatMessageDto): Promise<ChatMessage> {
    const [id] = await db(this.tableName).insert({
      ...data,
      sources: JSON.stringify(data.sources || []),
      created_at: new Date()
    });

    const message = await this.findById(id);
    if (!message) {
      throw new Error('Failed to create chat message');
    }
    return message;
  }

  async findById(id: number | string): Promise<ChatMessage | null> {
    const message = await db(this.tableName)
      .where('id', id)
      .first();
    
    if (!message) return null;
    
    return {
      ...message,
      sources: typeof message.sources === 'string' 
        ? JSON.parse(message.sources) 
        : message.sources
    };
  }

  async findBySessionId(sessionId: number | string): Promise<ChatMessage[]> {
    const messages = await db(this.tableName)
      .where('session_id', sessionId)
      .orderBy('created_at', 'asc');
    
    return messages.map(message => ({
      ...message,
      sources: typeof message.sources === 'string' 
        ? JSON.parse(message.sources) 
        : message.sources
    }));
  }

  async deleteBySessionId(sessionId: number | string): Promise<boolean> {
    const deleted = await db(this.tableName)
      .where('session_id', sessionId)
      .delete();
    
    return deleted > 0;
  }
}

export default new ChatMessageModel();