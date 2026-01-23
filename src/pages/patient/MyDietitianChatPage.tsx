import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Loader2, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { chatService, type Message } from '@/services/chat.service';
import { dietitianService } from '@/services/dietitian.service';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function MyDietitianChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [dietitian, setDietitian] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          const msgs = await chatService.getMessages(dietData.dietitian.user.id);
          setMessages(msgs);

          // Start polling with the dietitian's user ID
          // Poll every 3 seconds (Optimized for API Chat)
          intervalId = setInterval(async () => {
            try {
              const newMsgs = await chatService.getMessages(dietData.dietitian.user.id);
              setMessages(prev => {
                // Only update if length changed or last message different to avoid jitters
                if (newMsgs.length !== prev.length || newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id) {
                  return newMsgs;
                }
                return prev;
              });
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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      alert('Failed to send message');
      // Revert optimistic update could be done here
    } finally {
      setIsSending(false);
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
      <Card className="flex items-center gap-4 p-4 rounded-t-2xl rounded-b-none border-b-0 z-10 shadow-sm">
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
          <p className="text-xs text-muted-foreground">Certified Dietitian</p>
        </div>
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
              <MessageBubble
                key={msg.id}
                content={msg.content}
                isMyMessage={!isDietitianSender}
                timestamp={msg.timestamp}
                senderName={isDietitianSender ? dietitian.fname : "Me"}
                senderImage={isDietitianSender ? dietitian.image : undefined}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Card className="p-4 rounded-t-none rounded-b-2xl border-t-0 shadow-sm">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="rounded-xl"
            disabled={isSending}
          />
          <Button type="submit" size="icon" className="rounded-xl h-10 w-10" disabled={isSending || !newMessage.trim()}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </Card>
    </div>
  );
}
