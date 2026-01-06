"use client"

import { useState, useRef, useEffect } from 'react';
// MainLayout is provided by the route wrapper in App.tsx
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Mic, Image as ImageIcon, Sparkles, StopCircle, Paperclip, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock types
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'voice';
  timestamp: Date;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setHasStarted(true);
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm analyzing your request. Based on your nutritional profile, this looks like a balanced choice, though you might want to increase the protein content.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setInputValue(prev => prev + ' (Voice transcription)');
    } else {
      setIsRecording(true);
    }
  };

  const sampleQueries = [
    { icon: <ChefHat className="w-4 h-4" />, text: "Suggest a high-protein breakfast" },
    { icon: <ImageIcon className="w-4 h-4" />, text: "Analyze this meal photo" },
    { icon: <Sparkles className="w-4 h-4" />, text: "Plan meals for tomorrow" },
    { icon: <Bot className="w-4 h-4" />, text: "Explain my macro goals" },
  ];

  const handleSampleClick = (text: string) => {
    setInputValue(text);
  }

  return (
    <>
      <div className="relative flex flex-col h-full items-center w-full max-w-3xl mx-auto">

        {/* Messages Area - Only visible after start */}
        {hasStarted && (
          <ScrollArea className="flex-1 w-full px-4 pt-4 pb-0">
            <div className="flex flex-col gap-6 pb-4">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={cn(
                    "flex gap-4 max-w-[90%]",
                    msg.role === 'user' ? "self-end flex-row-reverse" : "self-start"
                  )}
                >
                  <Avatar className="h-8 w-8 border border-border">
                    {msg.role === 'assistant' ? (
                      <>
                        <AvatarImage src="/bot-avatar.png" />
                        <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-4 h-4" /></AvatarFallback>
                      </>
                    ) : (
                      <>
                        <AvatarImage src="/user-avatar.png" />
                        <AvatarFallback className="bg-muted text-muted-foreground"><User className="w-4 h-4" /></AvatarFallback>
                      </>
                    )}
                  </Avatar>

                  <div className={cn(
                    "group relative px-5 py-3.5 rounded-3xl text-sm md:text-base leading-relaxed shadow-sm",
                    msg.role === 'assistant'
                      ? "bg-card border border-border text-card-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span className={cn("text-[10px] mt-1 block opacity-50 absolute -bottom-5 min-w-[60px]", msg.role === 'user' ? "right-0 text-right" : "left-0 text-left")}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 self-start max-w-[85%]"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary"><Bot className="w-4 h-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-border px-5 py-4 rounded-3xl rounded-tl-none flex items-center gap-2 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-100" />
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce delay-200" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </ScrollArea>
        )}

        {/* Input Area Container - Centered initially, then moves to bottom */}
        <motion.div
          layout
          className={cn(
            "w-full px-4 transition-all duration-500 ease-in-out z-20",
            hasStarted ? "mt-auto pb-4" : "my-auto flex flex-col items-center justify-center mt-20"
          )}
        >
          {/* Logo & Heading - Only visible when NOT started */}
          <AnimatePresence>
            {!hasStarted && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="flex flex-col items-center gap-6 mb-10 text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center shadow-sm border border-primary/10">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">How can I help you thrive today?</h1>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">Ask about your meal plan, analyze a photo, or get nutrition advice.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Box */}
          <div className="w-full relative bg-card rounded-3xl border border-border shadow-lg focus-within:shadow-xl focus-within:border-primary/50 transition-all overflow-hidden ring-offset-2 focus-within:ring-2 ring-primary/20">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="w-full min-h-[60px] max-h-[200px] border-none shadow-none resize-none px-4 pt-4 pb-14 text-base bg-transparent focus-visible:ring-0"
            />

            {/* Bottom Actions */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" title="Attach file">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleRecording}
                className={cn(
                  "h-9 w-9 rounded-full transition-colors",
                  isRecording ? "text-destructive bg-destructive/10 hover:bg-destructive/20" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                )}
                title="Voice input"
              >
                {isRecording ? <StopCircle className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
              </Button>
            </div>

            <div className="absolute bottom-2 right-2">
              <Button
                size="icon"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() && !isRecording}
                className={cn(
                  "h-9 w-9 rounded-full transition-all duration-200",
                  inputValue.trim() ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transform hover:scale-105" : "bg-muted text-muted-foreground"
                )}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Sample Queries - Only visible when NOT started */}
          <AnimatePresence>
            {!hasStarted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl mx-auto"
              >
                {sampleQueries.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSampleClick(q.text)}
                    className="flex items-center gap-3 p-4 text-left bg-card border border-border hover:border-primary/30 hover:bg-muted/50 hover:shadow-md rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2 bg-muted text-muted-foreground rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {q.icon}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">{q.text}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            layout
            className="text-center text-xs text-muted-foreground mt-4"
          >
            AI can make mistakes. Verify important info.
          </motion.p>
        </motion.div>
      </div>
    </>
  );
}
