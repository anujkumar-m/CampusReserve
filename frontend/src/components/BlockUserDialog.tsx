import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface BlockUserDialogProps {
    user: {
        id?: string;
        _id?: string;
        name: string;
        email: string;
        role: string;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BlockUserDialog({
    user,
    open,
    onOpenChange,
}: BlockUserDialogProps) {
    const [reason, setReason] = useState('');

    const queryClient = useQueryClient();

    const blockMutation = useMutation({
        mutationFn: (data: { id: string; reason?: string }) =>
            userService.block(data.id, data.reason),
        onSuccess: () => {
            toast.success('User blocked successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onOpenChange(false);
            setReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to block user');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        blockMutation.mutate({
            id: user!._id || user!.id!,
            reason: reason || undefined,
        });
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <ShieldOff className="h-5 w-5" />
                        Block User
                    </DialogTitle>
                    <DialogDescription>
                        This will prevent the user from logging in and cancel all their active bookings.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* User Details */}
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                        <div className="space-y-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter reason for blocking this user..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                setReason('');
                            }}
                            disabled={blockMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={blockMutation.isPending}
                        >
                            {blockMutation.isPending ? 'Blocking...' : 'Block User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
