import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Loader2, MessageCircle, Trash2, Paperclip } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatService, type Message } from '@/services/chat.service';
import { dietitianService } from '@/services/dietitian.service';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from "sonner";

export default function MyDietitianChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [dietitian, setDietitian] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const lastMessageHashRef = useRef<string>('');
  // const { showNotification } = useNotification(); - Removed invalid hook

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: number } | null>(null);

  // Initial fetch & polling
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const init = async () => {
      setIsLoading(true);
      try {
        // Fetch Dietitian
        const dietData = await dietitianService.getMyDietitian();
        setDietitian(dietData.dietitian);

        // Fetch Messages (filtered by dietitian's user ID)
        if (dietData.dietitian?.user?.id) {
          const msgsResponse = await chatService.getMessages(dietData.dietitian.user.id);
          let msgs = msgsResponse && (Array.isArray(msgsResponse) ? msgsResponse : msgsResponse.results) ? (Array.isArray(msgsResponse) ? msgsResponse : msgsResponse.results) : [];
          msgs = msgs.sort((a: Message, b: Message) => a.id - b.id);
          lastMessageHashRef.current = msgs.map((m: Message) => `${m.id}:${m.is_read}`).join(',');
          setMessages(msgs);

          // Start polling with the dietitian's user ID using hash comparison
          intervalId = setInterval(async () => {
            try {
              const newMsgsResponse = await chatService.getMessages(dietData.dietitian.user.id);
              let newMsgs = newMsgsResponse && (Array.isArray(newMsgsResponse) ? newMsgsResponse : newMsgsResponse.results) ? (Array.isArray(newMsgsResponse) ? newMsgsResponse : newMsgsResponse.results) : [];

              // Sort messages by ID to ensure stable order
              newMsgs = newMsgs.sort((a: Message, b: Message) => a.id - b.id);

              // Create hash and only update if changed
              const newHash = newMsgs.map((m: Message) => `${m.id}:${m.is_read}`).join(',');
              if (newHash !== lastMessageHashRef.current) {
                lastMessageHashRef.current = newHash;
                setMessages(newMsgs);
              }
            } catch (e) { console.error("Polling error", e); }
          }, 3000);
        }
      } catch (e) {
        console.error("Failed to load chat", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Scroll to bottom only when new messages are added (not on every poll)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !dietitian?.user?.id) return;

    const tempContent = newMessage;
    setNewMessage(''); // Clear input immediately
    setIsSending(true);

    // Optimistic Update
    const optimisticMessage: Message = {
      id: Date.now(),
      sender: 0, // Unknown ID temporarily
      sender_email: "", // User's email
      receiver: dietitian.user.id,
      receiver_email: dietitian.user.email,
      content: tempContent,
      timestamp: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await chatService.sendMessage(tempContent, dietitian.user.id);
      const msgs = await chatService.getMessages(dietitian.user.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Send failed:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChatHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history? This action cannot be undone.')) {
      setMessages([]);
      toast.success('Chat history cleared');
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setContextMenu(null);
    toast.success('Message deleted');
  };

  const handleRightClick = (e: React.MouseEvent, messageId: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, messageId });
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`File "${file.name}" ready to send`);
      // TODO: Implement actual file upload to backend
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  }

  if (!dietitian) {
    return (
      <div className="p-8 text-center">
        <p>You are not connected to a dietitian.</p>
        <Link to="/my-dietitian"><Button variant="link">Go Back</Button></Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto">
      {/* Header */}
      <Card className="flex items-center justify-between gap-4 p-4 rounded-t-2xl rounded-b-none border-b-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/my-dietitian">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={dietitian.image} />
            <AvatarFallback>{dietitian.fname[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-bold text-sm md:text-base">{dietitian.fname} {dietitian.lname}</h2>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" /> Online
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive gap-2"
          onClick={handleClearChatHistory}
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Clear Chat</span>
        </Button>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-muted/20 border-x border-border">
        {messages.length === 0 ? (
          <div className="text-center py-12 opacity-50">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isDietitianSender = msg.sender_email === dietitian.user.email;
            return (
              <div
                key={msg.id}
                onContextMenu={(e) => handleRightClick(e, msg.id)}
                className="relative"
              >
                <MessageBubble
                  content={msg.content}
                  isMyMessage={!isDietitianSender}
                  timestamp={msg.timestamp}
                  senderName={isDietitianSender ? dietitian.fname : "Me"}
                  senderImage={isDietitianSender ? dietitian.image : undefined}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-card border border-border rounded-lg shadow-lg py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
          >
            <Trash2 className="w-4 h-4" /> Delete Message
          </button>
        </div>
      )}

      {/* Input Area */}
      <Card className="p-4 rounded-t-none rounded-b-2xl border-t-0 shadow-sm">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleFileUpload}
            title="Upload file"
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="rounded-xl flex-1"
            disabled={isSending}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90 shrink-0"
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </Card>
    </div>
  );
}
