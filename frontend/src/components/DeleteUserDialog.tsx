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
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteUserDialogProps {
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

export function DeleteUserDialog({
    user,
    open,
    onOpenChange,
}: DeleteUserDialogProps) {
    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (id: string) => userService.delete(id),
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onOpenChange(false);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        },
    });

    const handleDelete = () => {
        deleteMutation.mutate(user!._id || user!.id!);
    };

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete User
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. The user will be permanently deleted.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* User Details */}
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                        <div className="space-y-1">
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground capitalize">Role: {user.role}</p>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <p className="text-sm text-amber-600 dark:text-amber-500">
                            <strong>Note:</strong> Users with active bookings cannot be deleted.
                            Please cancel or complete their bookings first.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={deleteMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
