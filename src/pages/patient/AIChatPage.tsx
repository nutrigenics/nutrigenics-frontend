"use client"

import logo from '@/assets/logo.svg';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Send, Mic, Image as ImageIcon, Sparkles, StopCircle, Paperclip, ChefHat, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image' | 'voice';
  timestamp: Date;
  metadata?: any;
  isStreaming?: boolean;
}

// Smooth streaming component
const StreamingMarkdown = ({ content, isComplete }: { content: string, isComplete: boolean }) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    if (isComplete) {
      setDisplayedContent(content);
      return;
    }

    let currentLength = displayedContent.length;
    const targetLength = content.length;

    // If we are far behind, catch up faster
    const speed = targetLength - currentLength > 50 ? 5 : targetLength - currentLength > 10 ? 2 : 1;

    if (currentLength < targetLength) {
      const timeout = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentLength + speed));
      }, 15); // Slightly faster update rate
      return () => clearTimeout(timeout);
    }
  }, [content, displayedContent, isComplete]);

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2" {...props} />,
          code: ({ node, ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
        }}
      >
        {displayedContent + (isComplete ? '' : ' ▍')}
      </ReactMarkdown>
    </div>
  );
};

// Socket.IO Server URL (Flask RAG Server)
const SOCKET_URL = 'http://localhost:5001';

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>('session-' + Date.now());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusMessage]);

  // Connect to Socket.IO on mount
  useEffect(() => {
    // Generate session ID if not exists (or could fetch from localStorage)
    if (!sessionIdRef.current) {
      sessionIdRef.current = 'session-' + Date.now();
    }

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    // ... rest of socket init ...
    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to AI Assistant');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.warn('Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('response', (data: any) => {
      setIsLoading(false);
      setStatusMessage('');
      handleSocketMessage(data);
    });

    newSocket.on('stream_chunk', (data: any) => {
      setIsLoading(false);
      setStatusMessage('');
      handleSocketMessage({ ...data, type: 'stream_chunk' });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleSocketMessage = (data: any) => {
    if (data.type === 'response') {
      // Final response
      const newMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: {
          mode: data.mode,
          recipes_found: data.recipes_found
        },
        isStreaming: false
      };

      if (streamingMessageIdRef.current) {
        setMessages(prev => prev.map(msg =>
          msg.id === streamingMessageIdRef.current
            ? { ...newMessage, id: streamingMessageIdRef.current }
            : msg
        ));
        streamingMessageIdRef.current = null;
      } else {
        setMessages(prev => [...prev, newMessage]);
      }

    } else if (data.type === 'stream_chunk') {
      // Streaming chunk
      setMessages(prev => {
        const existingStreamingMsg = prev.find(msg => msg.id === streamingMessageIdRef.current);

        if (existingStreamingMsg) {
          return prev.map(msg =>
            msg.id === streamingMessageIdRef.current
              ? { ...msg, content: msg.content + data.chunk }
              : msg
          );
        } else {
          const newId = 'streaming-' + Date.now();
          streamingMessageIdRef.current = newId;
          return [...prev, {
            id: newId,
            role: 'assistant',
            content: data.chunk,
            timestamp: new Date(),
            isStreaming: true
          }];
        }
      });
    } else if (data.type === 'status') {
      setIsLoading(true);
      setStatusMessage(data.message);
    } else if (data.type === 'error') {
      toast.error(data.message);
      streamingMessageIdRef.current = null;
      setIsLoading(false);
    }
  };

  // Textarea auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !selectedImage) || !socket) return;

    if (!socket.connected) {
      toast.error('Not connected to chatbot server');
      return;
    }

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: selectedImage ? 'image' : 'text',
      // Include image in local message for display
      metadata: selectedImage ? { image: selectedImage } : undefined
    };

    setHasStarted(true);
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);
    setStatusMessage('Thinking...');

    const payload = {
      text: inputValue,
      image: selectedImage || '',
      session_id: sessionIdRef.current // Use persistent session ID
    };

    socket.emit('message', payload);

    setInputValue('');
    setSelectedImage(null);
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
      setInputValue(prev => prev + ' (Voice transcription unimplemented)');
    } else {
      setIsRecording(true);
    }
  };

  // Client-side image compression
  const compressImage = (base64Str: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        try {
          const compressed = await compressImage(result);
          setSelectedImage(compressed);
          toast.success('Image attached');
        } catch (error) {
          console.error("Compression error", error);
          toast.error("Failed to process image");
        }
      };
      reader.readAsDataURL(file);
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
                    "group relative px-5 py-3.5 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm",
                    msg.role === 'assistant'
                      ? "bg-card border border-border text-card-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  )}>
                    {msg.type === 'image' && (
                      <div className="mb-2">
                        {msg.metadata?.image ? (
                          <img
                            src={msg.metadata.image}
                            alt="User Upload"
                            className="max-w-[200px] h-auto rounded-lg border border-primary/20 mb-2"
                          />
                        ) : (
                          <span className="text-xs italic opacity-70 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image attached</span>
                        )}
                      </div>
                    )}
                    <div className="prose prose-sm  max-w-none break-words">
                      {msg.role === 'assistant' ? (
                        <StreamingMarkdown
                          content={msg.content}
                          isComplete={!msg.isStreaming}
                        />
                      ) : (
                        <p>{msg.content}</p>
                      )}
                    </div>
                    {/* Streaming indicator handled by component now */}
                    {/* Streaming indicator handled by component now */}
                    <span className={cn("text-[10px] mt-1 block opacity-50 absolute -bottom-5 min-w-[60px]", msg.role === 'user' ? "right-0 text-right" : "left-0 text-left")}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              <div ref={messagesEndRef} className="h-4" />

              {/* Loading Indicator with Animated Logo */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-start justify-center w-full py-4 gap-4 pl-2"
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <div className="relative bg-card p-3 rounded-2xl border border-border/50 shadow-lg">
                      <motion.img
                        src={logo}
                        alt="Process"
                        className="w-8 h-8"
                        animate={{
                          rotate: 360
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <motion.span
                      key={statusMessage} // Animate when text changes
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
                    >
                      {statusMessage || 'Thinking...'}
                    </motion.span>
                    <div className="flex gap-1">
                      <motion.span className="w-1 h-1 bg-muted-foreground/40 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} />
                      <motion.span className="w-1 h-1 bg-muted-foreground/40 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                      <motion.span className="w-1 h-1 bg-muted-foreground/40 rounded-full" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Input Area Container */}
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
                  <img src={logo} alt="Nutrigenics" className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">How can I help you thrive today?</h1>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">Ask about your meal plan, analyze a photo, or get nutrition advice.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Box */}
          <div className="w-full relative bg-card rounded-2xl border border-border shadow-premium focus-within:shadow-premium-lg focus-within:border-primary/50 transition-all overflow-hidden ring-offset-2 focus-within:ring-2 ring-primary/20 flex flex-col">

            {/* Image Preview Area - Distinct section */}
            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 pt-4 pb-2 border-b border-border/50 bg-muted/20"
                >
                  <div className="relative inline-flex items-center gap-3 bg-background border border-border rounded-xl p-2 pr-4">
                    <img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded-lg bg-muted" />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">Image attached</span>
                      <span className="text-[10px] text-muted-foreground">Ready to analyze</span>
                    </div>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="ml-2 p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={(e) => {
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {
                  if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                      const reader = new FileReader();
                      reader.onload = async (e) => {
                        const result = e.target?.result as string;
                        try {
                          const compressed = await compressImage(result);
                          setSelectedImage(compressed);
                          toast.success('Image pasted from clipboard');
                        } catch (error) {
                          console.error("Paste compression error", error);
                          toast.error("Failed to process paste");
                        }
                      };
                      reader.readAsDataURL(blob);
                      e.preventDefault();
                    }
                  }
                }
              }}
              placeholder="Ask anything or paste an image..."
              className="w-full min-h-[60px] max-h-[200px] border-none shadow-none resize-none px-4 py-4 text-base bg-transparent focus-visible:ring-0"
              rows={1}
            />

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="sr-only"
              onChange={handleFileSelect}
            />

            {/* Bottom Actions Row */}
            <div className="flex justify-between items-center px-2 pb-2">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 gap-2 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }}
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-xs font-medium">Upload Image</span>
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

              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={(!inputValue.trim() && !selectedImage) || !isConnected}
                className={cn(
                  "h-9 w-9 rounded-full transition-all duration-200",
                  (inputValue.trim() || selectedImage) && isConnected ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transform hover:scale-105" : "bg-muted text-muted-foreground"
                )}
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>

          {!isConnected && (
            <div className="text-center mt-2">
              <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">Server disconnected</span>
            </div>
          )}

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
                    className="flex items-center gap-3 p-4 text-left bg-card border border-border hover:border-primary/30 hover:bg-muted/50 hover:shadow-md rounded-lg transition-all duration-200 group"
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
