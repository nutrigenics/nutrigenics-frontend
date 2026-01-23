import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge";

export type Option = {
    label: string;
    value: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select items...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onChange(newSelected);
    }

    const handleRemove = (value: string) => {
        onChange(selected.filter((item) => item !== value));
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full h-auto min-h-[3rem] justify-between hover:bg-background border-border rounded-xl", className)}
                >
                    <div className="flex flex-wrap gap-1 items-center justify-start py-1">
                        {selected.length > 0 ? (
                            selected.map((val) => {
                                const option = options.find((o) => o.value === val);
                                return (
                                    <Badge key={val} variant="secondary" className="mr-1 rounded-md px-1 py-0 text-xs font-normal relative pr-5 h-6 flex items-center">
                                        {option?.label || val}
                                        <div
                                            className="absolute right-0 top-0 bottom-0 px-1 flex items-center justify-center cursor-pointer hover:bg-destructive/10 hover:text-destructive rounded-r-md transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(val);
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </div>
                                    </Badge>
                                )
                            })
                        ) : (
                            <span className="text-muted-foreground font-normal">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-border rounded-xl" align="start">
                <Command className="rounded-xl">
                    <CommandInput placeholder={`Search ${placeholder.toLowerCase()}...`} className="h-9" />
                    <CommandEmpty>No option found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.label} // Use label for search filtering
                                onSelect={() => handleSelect(option.value)}
                                className="cursor-pointer"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selected.includes(option.value) ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
