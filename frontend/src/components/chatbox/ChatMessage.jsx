import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

const ChatMessage = ({ sender, text, isHtml = false }) => {
  const isUser = sender === 'user';
  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/23367813-6d25-41bb-b484-ab74a89aa914/df12f9e67a1460321940cf8885b06c0d.jpg";

  return (
    <div className={cn('flex items-end space-x-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8 self-start">
          <AvatarImage src={logoUrl} alt="Boogasi AI" />
          <AvatarFallback><Bot size={18} /></AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-md',
          isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-muted-foreground rounded-bl-none'
        )}
      >
        {isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: text }} />
        ) : (
          <p className="whitespace-pre-wrap">{text}</p>
        )}
      </div>
      {isUser && (
         <Avatar className="h-8 w-8 self-start">
          <AvatarFallback><User size={18} /></AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;