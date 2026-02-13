import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Settings,
    User,
    LayoutDashboard,
    Utensils,
    MessagesSquare,
    Search,
    BookOpen,
    Users,
    Building2,
    FileText
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command";

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    if (!user) return null;

    const patientCommands = {
        navigation: [
            { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
            { label: "Daily Plan", icon: Calendar, path: "/plan" },
            { label: "Recipes", icon: Utensils, path: "/recipes" },
            { label: "AI Assistant", icon: MessagesSquare, path: "/chat" },
            { label: "Search", icon: Search, path: "/search" },
        ],
        settings: [
            { label: "Profile", icon: User, path: "/profile", shortcut: "⌘P" },
            { label: "Settings", icon: Settings, path: "/settings", shortcut: "⌘S" },
            { label: "Bookmarks", icon: BookOpen, path: "/bookmarks" },
        ],
    };

    const dietitianCommands = {
        navigation: [
            { label: "Dashboard", icon: LayoutDashboard, path: "/dietitian/dashboard" },
            { label: "My Patients", icon: Users, path: "/dietitian/patients" },
            { label: "Messages", icon: MessagesSquare, path: "/dietitian/chats" },
        ],
        settings: [
            { label: "Profile", icon: User, path: "/dietitian/profile", shortcut: "⌘P" },
        ],
    };

    const hospitalCommands = {
        navigation: [
            { label: "Dashboard", icon: LayoutDashboard, path: "/hospital/dashboard" },
            { label: "Dietitians", icon: Users, path: "/hospital/dietitians" },
            { label: "Requests", icon: FileText, path: "/hospital/requests" },
        ],
        settings: [
            { label: "Profile", icon: Building2, path: "/hospital/profile", shortcut: "⌘P" },
        ],
    };

    const commandMap = {
        patient: patientCommands,
        dietitian: dietitianCommands,
        hospital: hospitalCommands,
    };

    const commands = commandMap[user.role as keyof typeof commandMap] || patientCommands;

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    {commands.navigation.map((item) => (
                        <CommandItem key={item.path} onSelect={() => runCommand(() => navigate(item.path))}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                        </CommandItem>
                    ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                    {commands.settings.map((item) => (
                        <CommandItem key={item.path} onSelect={() => runCommand(() => navigate(item.path))}>
                            <item.icon className="mr-2 h-4 w-4" />
                            <span>{item.label}</span>
                            {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
