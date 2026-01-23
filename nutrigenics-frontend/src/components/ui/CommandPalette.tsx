import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Calendar,
    Settings,
    User,
    LayoutDashboard,
    Utensils,
    MessageSquare,
    Search,
    BookOpen
} from "lucide-react";

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

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Navigation">
                    <CommandItem onSelect={() => runCommand(() => navigate("/"))}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/plan"))}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Daily Plan</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/recipes"))}>
                        <Utensils className="mr-2 h-4 w-4" />
                        <span>Recipes</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/chat"))}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>AI Assistant</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/search"))}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Search</span>
                    </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                    <CommandItem onSelect={() => runCommand(() => navigate("/profile"))}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                        <CommandShortcut>⌘P</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/settings"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                        <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => navigate("/bookmarks"))}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        <span>Bookmarks</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
