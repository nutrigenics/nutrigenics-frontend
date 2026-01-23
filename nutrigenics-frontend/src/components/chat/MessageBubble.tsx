import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
    content: string;
    isMyMessage: boolean;
    timestamp: string;
    senderName: string;
    senderImage?: string;
}

export function MessageBubble({ content, isMyMessage, timestamp, senderName, senderImage }: MessageBubbleProps) {
    return (
        <div className={cn("flex w-full gap-3 mb-4", isMyMessage ? "flex-row-reverse" : "flex-row")}>
            <Avatar className="w-8 h-8 mt-1 border border-border">
                <AvatarImage src={senderImage} />
                <AvatarFallback>{senderName[0]}</AvatarFallback>
            </Avatar>

            <div className={cn(
                "max-w-[70%] p-4 rounded-2xl text-sm shadow-sm",
                isMyMessage
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
            )}>
                <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                <span className={cn(
                    "text-[10px] mt-1 block opacity-70",
                    isMyMessage ? "text-primary-foreground" : "text-muted-foreground"
                )}>
                    {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
}
