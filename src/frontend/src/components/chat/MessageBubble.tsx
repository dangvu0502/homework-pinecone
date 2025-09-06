import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <Card className={`max-w-[70%] ${
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      }`}>
        <CardContent className="px-4 py-3">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 space-y-3">
              <Separator className={isUser ? 'bg-primary-foreground/20' : ''} />
              <div>
                <Badge variant="outline" className="text-xs mb-2">
                  Sources
                </Badge>
                <div className="space-y-2">
                  {message.sources.map((source, index) => (
                    <Card
                      key={`${source.documentId}-${index}`}
                      className="bg-background/50"
                    >
                      <CardContent className="p-2">
                        <div className="text-xs">
                          <span className="font-medium">{source.documentName}</span>
                          {source.page && <span className="ml-1">(p. {source.page})</span>}
                        </div>
                        {source.snippet && (
                          <div className="mt-1 text-xs italic text-muted-foreground truncate">
                            "{source.snippet}"
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="text-xs mt-2 opacity-60">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};