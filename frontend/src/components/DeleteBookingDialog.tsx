import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/bookingService';
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
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteBookingDialogProps {
    booking: {
        id: string;
        resourceName: string;
        userName: string;
        date: string;
        timeSlot: {
            start: string;
            end: string;
        };
        status: string;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteBookingDialog({
    booking,
    open,
    onOpenChange,
}: DeleteBookingDialogProps) {
    const [reason, setReason] = useState('');

    const queryClient = useQueryClient();

    const deleteMutation = useMutation({
        mutationFn: (data: { id: string; reason?: string }) =>
            bookingService.deleteAdmin(data.id, data.reason),
        onSuccess: () => {
            toast.success('Booking deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            onOpenChange(false);
            setReason('');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to delete booking');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            toast.error('Please provide a reason for deletion');
            return;
        }

        deleteMutation.mutate({
            id: booking!.id,
            reason,
        });
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Booking
                    </DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. Please provide a reason for deletion.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Booking Details */}
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-muted-foreground">Resource</p>
                                <p className="font-medium">{booking.resourceName}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">User</p>
                                <p className="font-medium">{booking.userName}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Date</p>
                                <p className="font-medium">
                                    {new Date(booking.date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Time</p>
                                <p className="font-medium">
                                    {booking.timeSlot.start} - {booking.timeSlot.end}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Status</p>
                                <p className="font-medium capitalize">{booking.status.replace('_', ' ')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Reason for Deletion <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter reason for deleting this booking..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            required
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
                            disabled={deleteMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="destructive"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete Booking'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
