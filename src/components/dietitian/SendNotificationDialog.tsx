import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { notificationService } from '@/services/notification.service';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';

interface SendNotificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: number | null;
    patientName?: string;
    onSuccess?: () => void;
}

export function SendNotificationDialog({ open, onOpenChange, patientId, patientName, onSuccess }: SendNotificationDialogProps) {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState('info');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientId) return;

        setLoading(true);
        try {
            await notificationService.sendNotification({
                user_id: patientId, // Backend expects 'user_id' which maps to the patient's User ID (or we handle mapping in backend)
                title,
                message,
                type
            });
            toast.success("Notification sent successfully");
            onOpenChange(false);
            setTitle('');
            setMessage('');
            onSuccess?.();
        } catch (error) {
            toast.error("Failed to send notification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Send Notification</DialogTitle>
                    <DialogDescription>
                        Send a message or reminder to {patientName || 'Patient'}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="info">Information</SelectItem>
                                <SelectItem value="reminder">Reminder</SelectItem>
                                <SelectItem value="warning">Alert/Warning</SelectItem>
                                <SelectItem value="message">Personal Message</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            placeholder="e.g., Hydration Check"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Message</Label>
                        <Textarea
                            placeholder="Type your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            className="min-h-[100px]"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Notification
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
