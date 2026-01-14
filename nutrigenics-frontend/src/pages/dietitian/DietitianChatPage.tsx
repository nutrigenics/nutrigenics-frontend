import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft, Loader2, MoreVertical } from 'lucide-react';
import { chatService } from '@/services/chat.service';
import type { Message } from '@/services/chat.service';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useAuth } from '@/context/AuthContext';

export default function DietitianChatPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // Dietitian user

  // Get current user ID from context or decode token if needed.
  // Assuming 'user' object has 'id'.
  // We need to know 'my_id' to determine sender/receiver in MessageBubble.
  const currentUserId = user?.id;

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // First, fetch patient details
  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
    }
  }, [patientId]);

  // Then, fetch messages when patient is loaded (and poll)
  useEffect(() => {
    if (patient?.user?.id) {
      fetchMessages();
      // Poll every 3 seconds for near-real-time feel without WebSocket complexity
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [patient?.user?.id]);

  const fetchPatientDetails = async () => {
    try {
      const patients = await dietitianDashboardService.getPatients();
      const target = (Array.isArray(patients) ? patients : patients.results).find((p: any) => p.id === Number(patientId));
      setPatient(target || null);
    } catch (error) {
      console.error("Failed to fetch patient details", error);
    }
  };

  const fetchMessages = async () => {
    try {
      // Use server-side filtering with patient.user.id
      if (patient?.user?.id) {
        const data = await chatService.getMessages(patient.user.id);
        const allMessages = Array.isArray(data) ? data : data.results || [];

        // Simple de-duplication check could act here if needed
        setMessages(allMessages);

        // Mark received messages as read
        const unread = allMessages.filter((m: Message) => !m.is_read && m.sender === patient.user.id);
        unread.forEach((m: Message) => chatService.markRead(m.id));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !patient?.user?.id) return;

    const tempContent = newMessage;
    setNewMessage(''); // Clear input immediately

    // Optimistic UI Update: Create a fake message object
    const optimisticMessage: Message = {
      id: Date.now(), // Temporary ID
      sender: currentUserId || 0,
      sender_email: user?.email || '',
      receiver: patient.user.id,
      receiver_email: patient.user.email,
      content: tempContent,
      timestamp: new Date().toISOString(),
      is_read: false
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await chatService.sendMessage(tempContent, patient.user.id);
      // Wait for next poll to sync real ID, or fetch immediately
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Rollback on error (optional, or show alert)
      alert("Failed to send message. Please retry.");
      fetchMessages(); // Re-sync state
    }
  };

  if (isLoading && !patient) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-h-[800px] bg-gray-50 rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm relative">
      {/* Chat Header */}
      <div className="bg-white p-4 items-center flex justify-between border-b border-gray-100 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Link to="/dietitian/chats">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:bg-gray-50 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          {patient ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                {patient.user.first_name[0]}{patient.user.last_name[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{patient.user.first_name} {patient.user.last_name}</h3>
                <p className="text-xs text-green-500 font-bold flex items-center">● Online</p>
              </div>
            </div>
          ) : (
            <div>Loading patient...</div>
          )}
        </div>

        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 rounded-full">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white/50 relative">
        <div className="flex justify-center my-4">
          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">Today</span>
        </div>

        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            <p className="mb-2">No messages yet.</p>
            <p className="text-sm">Start the conversation with {patient?.user?.first_name}.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              content={msg.content}
              isMyMessage={msg.sender === currentUserId}
              timestamp={msg.timestamp}
              senderName={msg.sender === currentUserId ? 'Me' : (patient?.user?.first_name || 'Patient')}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 z-10 sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-full pl-6 pr-12 py-6 bg-gray-50 border-gray-200 focus:ring-2 focus:ring-logo/20 focus:border-logo/50"
            />
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
