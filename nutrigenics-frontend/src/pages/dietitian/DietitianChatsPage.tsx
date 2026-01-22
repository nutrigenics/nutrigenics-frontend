import { MessageSquare, Search, Loader2, Users, Trash2, Paperclip, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { chatService } from '@/services/chat.service';
import type { Message } from '@/services/chat.service';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from "sonner";

export default function DietitianChatsPage() {
  const { patientId } = useParams<{ patientId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  // const { showNotification } = useNotification(); - Removed invalid hook
  const currentUserId = user?.id;

  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Chat state
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const lastMessageHashRef = useRef<string>('');

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: number } | null>(null);

  // Fetch patients list
  useEffect(() => {
    fetchPatients();
  }, [search]);

  // Handle URL patient selection
  useEffect(() => {
    if (patientId && patients.length > 0) {
      const patient = patients.find(p => p.id === Number(patientId));
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [patientId, patients]);

  // Fetch messages when patient selected
  useEffect(() => {
    if (selectedPatient?.user?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedPatient?.user?.id]);

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

  const fetchPatients = async () => {
    try {
      const data = await dietitianDashboardService.getPatients(search);
      setPatients(data && (Array.isArray(data) ? data : data.results) ? (Array.isArray(data) ? data : data.results) : []);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedPatient?.user?.id) return;

    // Only show loading indicator on initial fetch
    const isInitialFetch = lastMessageHashRef.current === '';
    if (isInitialFetch) {
      setIsChatLoading(true);
    }

    try {
      const data = await chatService.getMessages(selectedPatient.user.id);
      let allMessages = data && (Array.isArray(data) ? data : data.results) ? (Array.isArray(data) ? data : data.results) : [];

      // Sort messages by ID to ensure stable order
      allMessages = allMessages.sort((a: Message, b: Message) => a.id - b.id);

      // Create a hash of message IDs to compare
      const newHash = allMessages.map((m: Message) => `${m.id}:${m.is_read}`).join(',');

      // Only update state if the hash changed
      if (newHash !== lastMessageHashRef.current) {
        lastMessageHashRef.current = newHash;
        setMessages(allMessages);
      }

      // Mark unread messages as read (but don't trigger re-render)
      const unread = allMessages.filter((m: Message) => !m.is_read && m.sender === selectedPatient.user.id);
      if (unread.length > 0) {
        unread.forEach((m: Message) => chatService.markRead(m.id));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (isInitialFetch) {
        setIsChatLoading(false);
      }
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setMessages([]);
    // Don't expose patient ID in URL for privacy
    navigate('/dietitian/chats', { replace: true });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPatient?.user?.id) return;

    const tempContent = newMessage;
    setNewMessage('');

    // Optimistic update
    const optimisticMessage: Message = {
      id: Date.now(),
      sender: currentUserId || 0,
      sender_email: user?.email || '',
      receiver: selectedPatient.user.id,
      receiver_email: selectedPatient.user.email,
      content: tempContent,
      timestamp: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await chatService.sendMessage(tempContent, selectedPatient.user.id);
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      fetchMessages();
    }
  };

  const handleClearChatHistory = () => {
    if (window.confirm('Are you sure you want to clear all chat history with this patient? This action cannot be undone.')) {
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
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-card rounded-3xl overflow-hidden border border-border shadow-sm">
      {/* Left Panel - Conversations List */}
      <div className={cn(
        "w-full md:w-96 border-r border-border flex flex-col bg-card",
        selectedPatient ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-border rounded-xl"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {patients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No patients found</p>
            </div>
          ) : (
            patients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
                className={cn(
                  "p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/50",
                  selectedPatient?.id === patient.id && "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 relative">
                    {patient.user?.first_name?.[0] || patient.fname?.[0] || 'P'}{patient.user?.last_name?.[0] || patient.lname?.[0] || ''}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-foreground truncate">
                        {patient.user?.first_name || patient.fname} {patient.user?.last_name || patient.lname}
                      </h4>
                      {patient.last_message_time && !isNaN(new Date(patient.last_message_time).getTime()) && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(patient.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={cn(
                        "text-sm truncate",
                        patient.unread_count > 0 ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {patient.last_message || "Tap to start conversation"}
                      </p>
                      {patient.unread_count > 0 && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                          {patient.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-muted/20",
        !selectedPatient ? "hidden md:flex" : "flex"
      )}>
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-card border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-10 w-10 rounded-full"
                  onClick={() => {
                    setSelectedPatient(null);
                    navigate('/dietitian/chats', { replace: true });
                  }}
                >
                  ←
                </Button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                  {selectedPatient.user?.first_name?.[0] || 'P'}
                </div>
                <div>
                  <h3 className="font-bold text-foreground">
                    {selectedPatient.user?.first_name || selectedPatient.fname} {selectedPatient.user?.last_name || selectedPatient.lname}
                  </h3>
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
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isChatLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin w-6 h-6 text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                  <p className="font-medium">No messages yet</p>
                  <p className="text-sm">Start the conversation with {selectedPatient.user?.first_name || 'your patient'}</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center">
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">Today</span>
                  </div>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      onContextMenu={(e) => handleRightClick(e, msg.id)}
                      className="relative"
                    >
                      <MessageBubble
                        content={msg.content}
                        isMyMessage={msg.sender === currentUserId}
                        timestamp={msg.timestamp}
                        senderName={msg.sender === currentUserId ? 'Me' : (selectedPatient?.user?.first_name || 'Patient')}
                      />
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
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

            {/* Message Input */}
            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
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
                  className="h-12 w-12 rounded-full text-muted-foreground hover:text-foreground shrink-0"
                  onClick={handleFileUpload}
                  title="Upload file"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-12 rounded-full pl-5 pr-4 bg-muted/50 border-border focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg disabled:opacity-50 shrink-0"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageSquare className="w-12 h-12 opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Select a conversation</h3>
            <p className="text-center max-w-sm">Choose a patient from the list to start messaging or continue a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
