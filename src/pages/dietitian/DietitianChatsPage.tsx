import { MessagesSquare, Search, Loader2, Send, Paperclip, X, FileText, ShieldCheck, MessageCircle, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { dietitianDashboardService } from '@/services/dietitian-dashboard.service';
import { chatService, type Message } from '@/services/chat.service';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Patient {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export default function DietitianChatsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch patients
  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      const data = await dietitianDashboardService.getPatients(search);
      setPatients(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages when patient selected
  useEffect(() => {
    if (!selectedPatient?.user?.id) {
      setMessages([]);
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    setIsLoadingMessages(true);

    const loadMessages = async () => {
      try {
        const msgs = await chatService.getMessages(selectedPatient.user.id);
        setMessages(msgs);
        setIsLoadingMessages(false);

        // Poll for new messages
        intervalId = setInterval(async () => {
          try {
            const newMsgs = await chatService.getMessages(selectedPatient.user.id);
            setMessages(prev => {
              if (newMsgs.length !== prev.length || newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id) {
                return newMsgs;
              }
              return prev;
            });
          } catch (e) { console.error("Polling error", e); }
        }, 3000);
      } catch (e) {
        console.error("Failed to load messages", e);
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedPatient]);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be under 5MB");
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !selectedPatient?.user?.id || !user) return;

    if (selectedFile) {
      toast.info("Image support pending backend update. Sending text only.");
      clearFile();
      if (!newMessage.trim()) return;
    }

    const tempContent = newMessage;
    setNewMessage('');
    setIsSending(true);

    // Optimistic update
    const optimisticMessage: Message = {
      id: Date.now(),
      sender: user.id,
      sender_email: user.email,
      receiver: selectedPatient.user.id,
      receiver_email: selectedPatient.user.email,
      content: tempContent,
      timestamp: new Date().toISOString(),
      is_read: false
    };
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      await chatService.sendMessage(tempContent, selectedPatient.user.id);
      const msgs = await chatService.getMessages(selectedPatient.user.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Send failed:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  return (
    <div className="h-full flex bg-white overflow-hidden">
      {/* Left Sidebar - Patient List - Hidden on mobile when chat is open */}
      <div className={cn(
        "w-full md:w-[340px] border-r border-slate-100 flex flex-col bg-white",
        selectedPatient ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <MessagesSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Messages</h2>
              <p className="text-xs text-slate-500">{patients.length} patients</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search patients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-slate-200 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Patient List */}
        <div className="flex-1 overflow-y-auto">
          {patients.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessagesSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No patients found</p>
            </div>
          ) : (
            patients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <div
                  onClick={() => setSelectedPatient(patient)}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer transition-all border-b border-slate-50",
                    selectedPatient?.id === patient.id
                      ? "bg-emerald-50 border-l-2 border-l-emerald-500"
                      : "hover:bg-slate-50"
                  )}
                >
                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                    <AvatarFallback className={cn(
                      "font-bold text-sm",
                      selectedPatient?.id === patient.id
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-blue-100 text-blue-600"
                    )}>
                      {patient.user.first_name?.[0]}{patient.user.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className={cn(
                        "font-semibold text-sm truncate",
                        selectedPatient?.id === patient.id ? "text-emerald-700" : "text-slate-900"
                      )}>
                        {patient.user.first_name} {patient.user.last_name}
                      </h4>
                      {patient.last_message_time && (
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {new Date(patient.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={cn(
                        "text-xs truncate",
                        patient.unread_count && patient.unread_count > 0 ? "font-semibold text-slate-800" : "text-slate-500"
                      )}>
                        {patient.last_message || "Tap to start chat"}
                      </p>
                      {patient.unread_count && patient.unread_count > 0 && (
                        <Badge className="bg-emerald-500 text-white text-xs h-5 min-w-[20px] flex items-center justify-center">
                          {patient.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area - Full width on mobile when open */}
      <div className={cn(
        "flex-1 flex-col bg-[#FAFAFA]",
        selectedPatient ? "flex" : "hidden md:flex"
      )}>
        {selectedPatient ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-3 md:px-5 flex items-center gap-3 border-b border-slate-100 bg-white">
              {/* Back button - visible on mobile only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPatient(null)}
                className="md:hidden h-9 w-9 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex-shrink-0"
                aria-label="Back to patient list"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                <AvatarFallback className="bg-emerald-50 text-emerald-600 font-bold">
                  {selectedPatient.user.first_name?.[0]}{selectedPatient.user.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-slate-900">
                  {selectedPatient.user.first_name} {selectedPatient.user.last_name}
                </h3>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Online
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Date Badge */}
              <div className="flex justify-center mb-4">
                <Badge variant="outline" className="bg-white text-slate-400 border-slate-200 text-xs px-3 py-1">
                  Today
                </Badge>
              </div>

              {isLoadingMessages ? (
                <div className="flex justify-center p-10">
                  <Loader2 className="animate-spin text-emerald-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-7 h-7 text-emerald-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No messages yet</p>
                  <p className="text-xs text-slate-400 mt-1">Send a message to {selectedPatient.user.first_name}</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMyMessage = msg.sender === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex w-full", isMyMessage ? 'justify-end' : 'justify-start')}>
                      <div className={cn("flex flex-col max-w-[70%]", isMyMessage ? 'items-end' : 'items-start')}>
                        <div className={cn(
                          "px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                          isMyMessage
                            ? 'bg-emerald-600 text-white rounded-2xl rounded-tr-md'
                            : 'bg-white border border-slate-100 text-slate-800 rounded-2xl rounded-tl-md'
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-slate-400 mt-1 px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              {/* File Preview */}
              {selectedFile && (
                <div className="mb-3 p-2 bg-slate-50 rounded-xl flex items-center gap-3">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={clearFile} className="p-1 hover:bg-slate-200 rounded-full text-slate-400" aria-label="Remove selected file">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 flex-shrink-0"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 h-11 bg-slate-50 border-slate-200 rounded-full px-4 text-sm focus:bg-white"
                  disabled={isSending}
                />
                <Button
                  type="submit"
                  disabled={isSending || (!newMessage.trim() && !selectedFile)}
                  aria-label="Send message"
                  className={cn(
                    "h-10 w-10 rounded-full flex-shrink-0",
                    (isSending || (!newMessage.trim() && !selectedFile))
                      ? 'bg-slate-200 text-slate-400'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  )}
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
              <p className="text-center text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Encrypted & Secure
              </p>
            </div>
          </>
        ) : (
          /* Empty State - No patient selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-slate-50 to-white">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <MessagesSquare className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Patient Messages</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Select a patient from the left panel to start or continue a conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
