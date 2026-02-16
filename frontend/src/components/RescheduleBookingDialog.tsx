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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface RescheduleBookingDialogProps {
    booking: {
        id: string;
        resourceName: string;
        date: string;
        timeSlot: {
            start: string;
            end: string;
        };
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RescheduleBookingDialog({
    booking,
    open,
    onOpenChange,
}: RescheduleBookingDialogProps) {
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [reason, setReason] = useState('');

    const queryClient = useQueryClient();

    const rescheduleMutation = useMutation({
        mutationFn: (data: { date: string; timeSlot: { start: string; end: string }; reason?: string }) =>
            bookingService.reschedule(booking!.id, data),
        onSuccess: () => {
            toast.success('Booking rescheduled successfully');
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            onOpenChange(false);
            resetForm();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reschedule booking');
        },
    });

    const resetForm = () => {
        setDate('');
        setStartTime('');
        setEndTime('');
        setReason('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !startTime || !endTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (startTime >= endTime) {
            toast.error('End time must be after start time');
            return;
        }

        rescheduleMutation.mutate({
            date,
            timeSlot: { start: startTime, end: endTime },
            reason: reason || undefined,
        });
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Reschedule Booking
                    </DialogTitle>
                    <DialogDescription>
                        Reschedule booking for <strong>{booking.resourceName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current Details */}
                    <div className="rounded-lg bg-muted p-3 text-sm">
                        <p className="font-medium mb-1">Current Schedule:</p>
                        <p className="text-muted-foreground">
                            {new Date(booking.date).toLocaleDateString()} • {booking.timeSlot.start} - {booking.timeSlot.end}
                        </p>
                    </div>

                    {/* New Date */}
                    <div className="space-y-2">
                        <Label htmlFor="date">
                            New Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    {/* New Time Slot */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">
                                Start Time <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">
                                End Time <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="endTime"
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter reason for rescheduling..."
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
                                resetForm();
                            }}
                            disabled={rescheduleMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={rescheduleMutation.isPending}>
                            {rescheduleMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
