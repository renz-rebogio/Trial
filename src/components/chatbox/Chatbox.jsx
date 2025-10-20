import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ThumbsUp, ThumbsDown, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from '@/components/chatbox/ChatMessage';
import WelcomeMessage from '@/components/chatbox/WelcomeMessage';
import FeedbackButtons from '@/components/chatbox/FeedbackButtons';
import useChatLogic from '@/components/chatbox/useChatLogic';
import { cn } from '@/lib/utils';

const Chatbox = ({ isOpen, onClose }) => {
  const { messages, inputText, setInputText, handleSendMessage, handleQuickAction, addMessage, userName } = useChatLogic(onClose);
  const scrollAreaRef = useRef(null);
  const inputRef = useRef(null);

  const logoUrl = "https://storage.googleapis.com/hostinger-horizons-assets-prod/23367813-6d25-41bb-b484-ab74a89aa914/df12f9e67a1460321940cf8885b06c0d.jpg";

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleSendMessage(inputText.trim());
    }
  };

  const handleFeedback = (messageId, feedbackType) => {
    console.log(`Feedback for message ${messageId}: ${feedbackType}`);
    addMessage({
      id: Date.now() + 1,
      sender: 'system',
      text: `Thank you for your feedback!`,
      noFeedback: true,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-20 right-6 w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-[hsl(var(--ai-assistant-input-bg))] text-card-foreground rounded-xl shadow-2xl border border-[hsl(var(--boogasi-teal-val))]/50 flex flex-col overflow-hidden z-[999]"
          aria-modal="true"
          role="dialog"
          aria-labelledby="chatbox-title"
        >
          <header className="flex items-center justify-between p-4 border-b border-[hsl(var(--boogasi-teal-val))]/30 bg-[hsl(var(--ai-assistant-header-bg))] text-primary-foreground">
            <div className="flex items-center space-x-2">
              <img src={logoUrl} alt="Boogasi Logo" className="h-8 w-8 rounded-md" />
              <h2 id="chatbox-title" className="text-lg font-semibold">Boogasi Assistant</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat" className="text-primary-foreground hover:bg-white/20">
              <X size={20} className="icon-neon-red" />
            </Button>
          </header>

          <ScrollArea className="flex-grow p-4 bg-[hsl(var(--ai-assistant-input-bg))]/80" ref={scrollAreaRef}>
            <div className="space-y-4">
              <WelcomeMessage onQuickAction={handleQuickAction} userName={userName} />
              {messages.map((msg) => (
                <div key={msg.id}>
                  <ChatMessage sender={msg.sender} text={msg.text} isHtml={msg.isHtml} />
                  {msg.sender === 'ai' && !msg.noFeedback && (
                    <FeedbackButtons messageId={msg.id} onFeedback={handleFeedback} />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <footer className="p-4 border-t border-[hsl(var(--boogasi-teal-val))]/30 bg-[hsl(var(--ai-assistant-input-bg))]">
            <form onSubmit={onFormSubmit} className="flex items-center space-x-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask something..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-grow bg-background/70 border-[hsl(var(--boogasi-teal-val))]/40 focus:ring-[hsl(var(--boogasi-teal-val))] focus:border-[hsl(var(--boogasi-teal-val))]"
                aria-label="Chat message input"
              />
              <Button type="submit" size="icon" aria-label="Send message" disabled={!inputText.trim()} className="bg-[hsl(var(--ai-assistant-button-bg))] hover:bg-[hsl(var(--ai-assistant-button-bg))]/90 text-primary-foreground">
                <Send size={20} className="icon-neon-blue"/>
              </Button>
            </form>
            <div className="mt-2 text-center text-xs text-muted-foreground">
              Boogasi Assistant provides information only. Not a financial advisor.
              <Link to="/terms-and-conditions#ai-tools-disclaimer" className={cn("underline ml-1 hover:text-[hsl(var(--boogasi-green-val))] text-[hsl(var(--boogasi-green-val))]")} target="_blank" rel="noopener noreferrer">
                Learn More <ExternalLink size={12} className="inline-block icon-neon-green" />
              </Link>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Chatbox;