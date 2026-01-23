import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { Loader2, Lock } from "lucide-react";

interface ChangePasswordDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        old_password: "",
        new_password: "",
        confirm_password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        if (formData.new_password !== formData.confirm_password) {
            setError("New passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            await authService.changePassword(formData);
            setSuccess("Password changed successfully.");
            setFormData({ old_password: "", new_password: "", confirm_password: "" });
            setTimeout(() => onOpenChange(false), 1500);
        } catch (err: any) {
            const msg = err.response?.data?.old_password?.[0] ||
                err.response?.data?.new_password?.[0] ||
                err.response?.data?.confirm_password?.[0] ||
                err.response?.data?.detail ||
                "Failed to change password. Please try again.";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Lock className="w-5 h-5" />
                        </div>
                        Change Password
                    </DialogTitle>
                    <DialogDescription>
                        Enter your current password and a new secure password.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-xl font-medium">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 text-sm bg-green-500/10 text-green-600 rounded-xl font-medium">
                            {success}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="old_password">Current Password</Label>
                        <Input
                            id="old_password"
                            name="old_password"
                            type="password"
                            value={formData.old_password}
                            onChange={handleChange}
                            required
                            className="rounded-xl border-border focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new_password">New Password</Label>
                        <Input
                            id="new_password"
                            name="new_password"
                            type="password"
                            value={formData.new_password}
                            onChange={handleChange}
                            required
                            className="rounded-xl border-border focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Confirm New Password</Label>
                        <Input
                            id="confirm_password"
                            name="confirm_password"
                            type="password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                            className="rounded-xl border-border focus:ring-primary/20"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-border"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" className="rounded-xl font-bold shadow-md" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
