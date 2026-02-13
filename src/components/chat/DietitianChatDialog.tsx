import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2, MessageCircle, Paperclip, X, FileText, ShieldCheck } from 'lucide-react';
import { chatService, type Message } from '@/services/chat.service';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DietitianChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dietitian: {
        id: number;
        fname: string;
        lname: string;
        image?: string;
        user: {
            id: number;
            email: string;
        }
    } | null;
}

export function DietitianChatDialog({ open, onOpenChange, dietitian }: DietitianChatDialogProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // File Upload State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial fetch & polling
    useEffect(() => {
        if (!open || !dietitian?.user?.id) return;

        let intervalId: ReturnType<typeof setInterval> | null = null;
        setIsLoading(true);

        const init = async () => {
            try {
                // Fetch Messages
                const msgs = await chatService.getMessages(dietitian.user.id);
                setMessages(msgs);
                setIsLoading(false);

                // Start polling
                intervalId = setInterval(async () => {
                    try {
                        const newMsgs = await chatService.getMessages(dietitian.user.id);
                        setMessages(prev => {
                            if (newMsgs.length !== prev.length || newMsgs[newMsgs.length - 1]?.id !== prev[prev.length - 1]?.id) {
                                return newMsgs;
                            }
                            return prev;
                        });
                    } catch (e) { console.error("Polling error", e); }
                }, 3000);

            } catch (e) {
                console.error("Failed to load chat", e);
                setIsLoading(false);
            }
        };

        init();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [open, dietitian]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (open) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, previewUrl, open]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be under 5MB");
                return;
            }
            setSelectedFile(file);

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
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
        if ((!newMessage.trim() && !selectedFile) || !dietitian?.user?.id) return;

        // Temporary check for file upload purely on frontend
        if (selectedFile) {
            toast.info("Image support pending backend update. Sending text only for now.");
            clearFile();
            if (!newMessage.trim()) return;
        }

        const tempContent = newMessage;
        setNewMessage('');
        setIsSending(true);

        // Optimistic Update
        const optimisticMessage: Message = {
            id: Date.now(),
            sender: 0,
            sender_email: "",
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

    if (!dietitian) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-3xl h-[85vh] p-0 gap-0 overflow-hidden bg-[#F8FAFC] border-0 shadow-2xl flex flex-col">

                {/* Header */}
                <DialogHeader className="h-[72px] px-6 flex flex-row items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md z-40 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                <AvatarImage src={dietitian.image} className="object-cover" />
                                <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold">{dietitian.fname[0]}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="flex flex-col items-start gap-0.5">
                            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                                {dietitian.fname} {dietitian.lname}
                            </DialogTitle>
                            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Online Now
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close chat">
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 scroll-smooth custom-scrollbar relative bg-[#FAFAFA]">

                    <div className="max-w-3xl mx-auto space-y-6">
                        {/* Date Separator */}
                        <div className="flex justify-center mb-6">
                            <Badge variant="outline" className="bg-gray-50 text-gray-400 border-gray-200 font-normal px-3 py-1 text-xs uppercase tracking-widest">
                                Today
                            </Badge>
                        </div>

                        {isLoading && messages.length === 0 ? (
                            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50 select-none">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <MessageCircle className="w-8 h-8 text-indigo-300" />
                                </div>
                                <p className="text-lg font-semibold text-gray-900">No messages yet</p>
                                <p className="text-sm text-gray-500 mt-1">Start a conversation with Dr. {dietitian.lname}</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMyMessage = msg.sender_email !== dietitian.user.email;

                                return (
                                    <div key={msg.id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", isMyMessage ? 'justify-end' : 'justify-start')}>

                                        <div className={cn("flex flex-col max-w-[85%] md:max-w-[75%]", isMyMessage ? 'items-end' : 'items-start')}>

                                            <div className={cn("flex items-center gap-2 mb-1 px-1", isMyMessage ? 'flex-row-reverse' : 'flex-row')}>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>

                                            {/* Bubble */}
                                            <div className={cn(
                                                "relative px-4 py-3 text-[15px] leading-relaxed shadow-sm transition-all text-left",
                                                isMyMessage
                                                    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl rounded-tr-sm'
                                                    : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                                            )}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} className="h-2" />
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-white p-4 shrink-0 relative z-50">
                    <div className="max-w-3xl mx-auto relative">
                        {/* Preview */}
                        {selectedFile && (
                            <div className="absolute -top-20 left-0 bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 z-10">
                                {previewUrl ? (
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className="text-xs font-semibold text-gray-900 truncate max-w-[150px]">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <button type="button" onClick={clearFile} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors" aria-label="Remove selected file">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSend} className="relative group">
                            <div className="bg-gray-50 p-1.5 rounded-[2rem] border border-gray-200 flex items-center gap-2 focus-within:bg-white focus-within:shadow-md focus-within:border-indigo-200 transition-all duration-200">

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
                                    className="h-10 w-10 rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0"
                                    title="Attach file"
                                    aria-label="Attach file"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </Button>

                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-transparent border-0 focus-visible:ring-0 shadow-none px-2 text-base placeholder:text-gray-400 h-11"
                                    disabled={isSending}
                                />

                                <Button
                                    type="submit"
                                    disabled={isSending || (!newMessage.trim() && !selectedFile)}
                                    aria-label="Send message"
                                    className={cn(
                                        "h-10 px-5 rounded-3xl transition-all duration-300 flex items-center gap-2 font-medium shrink-0",
                                        (isSending || (!newMessage.trim() && !selectedFile))
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                            : 'bg-black hover:bg-gray-800 text-white shadow-sm hover:shadow-md active:scale-95'
                                    )}
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </div>
                        </form>

                        <div className="text-center mt-2">
                            <p className="text-xs font-medium text-gray-400 flex items-center justify-center gap-1.5 opacity-60">
                                <ShieldCheck className="w-3 h-3" /> Encrypted & Secure
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
