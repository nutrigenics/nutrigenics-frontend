import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface DeleteAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (password?: string) => Promise<void>;
    requirePassword?: boolean;
}

export function DeleteAccountDialog({
    open,
    onOpenChange,
    onConfirm,
    requirePassword = false,
}: DeleteAccountDialogProps) {
    const [password, setPassword] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const isConfirmValid = confirmText.toUpperCase() === 'DELETE';
    const canDelete = isConfirmValid && (!requirePassword || password.length > 0);

    const handleConfirm = async () => {
        if (!canDelete) return;

        setIsDeleting(true);
        try {
            await onConfirm(requirePassword ? password : undefined);
            // Reset state
            setPassword('');
            setConfirmText('');
        } catch {
            // Error handling is done in parent
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCancel = () => {
        setPassword('');
        setConfirmText('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100  rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600 " />
                        </div>
                        <DialogTitle className="text-xl">Delete Account</DialogTitle>
                    </div>
                    <DialogDescription className="space-y-3 text-left">
                        <p className="font-semibold text-foreground">
                            This action cannot be undone. This will permanently:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Delete your profile and personal information</li>
                            <li>Remove all your meal plans and recipes</li>
                            <li>Delete your chat history with dietitians</li>
                            <li>Remove all saved bookmarks and preferences</li>
                        </ul>
                        <p className="text-sm font-medium text-foreground mt-4">
                            To confirm, type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</span> below:
                        </p>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-4">
                    <div>
                        <Input
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type DELETE to confirm"
                            className="font-mono"
                            autoFocus
                        />
                    </div>

                    {requirePassword && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Password Confirmation</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!canDelete || isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
