import { useState } from 'react';
import { Booking } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Calendar, Clock, User, Edit, Trash2, CheckCircle, XCircle, AlertTriangle, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { RescheduleBookingDialog } from './RescheduleBookingDialog';
import { DeleteBookingDialog } from './DeleteBookingDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/bookingService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { BOOKING_TYPE_PRIORITY, PRIORITY_CONFIG } from '@/pages/BookingPage';

interface AdminBookingCardProps {
    booking: Booking;
}

export function AdminBookingCard({ booking }: AdminBookingCardProps) {
    const { user } = useAuth();
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');

    const queryClient = useQueryClient();

    const approveMutation = useMutation({
        mutationFn: () => bookingService.approveAdmin(booking.id),
        onSuccess: () => {
            toast.success('Booking approved successfully');
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve booking');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: (reason: string) => bookingService.rejectAdmin(booking.id, reason),
        onSuccess: () => {
            toast.success('Booking rejected successfully');
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject booking');
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (reason: string) => bookingService.cancel(booking.id, reason),
        onSuccess: () => {
            toast.success('Booking cancelled successfully');
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        },
    });

    const handleReject = () => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            rejectMutation.mutate(reason);
        }
    };

    const handleConfirmCancel = () => {
        if (cancellationReason.trim()) {
            cancelMutation.mutate(cancellationReason.trim());
            setIsCancelling(false);
            setCancellationReason('');
        }
    };

    const isPending = booking.status === 'pending_hod' || booking.status === 'pending_admin' || booking.status === 'auto_approved';
    const isAdmin = ['admin', 'infraAdmin', 'itAdmin'].includes(user?.role || '');
    const priority = BOOKING_TYPE_PRIORITY[booking.bookingType];
    const priorityCfg = priority ? PRIORITY_CONFIG[priority] : null;

    return (
        <>
            <Card className="card-interactive">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{booking.resourceName}</h3>
                            <p className="text-sm text-muted-foreground">{booking.purpose}</p>
                            {isAdmin && priorityCfg && (
                                <span className={`inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${priorityCfg.className}`}>
                                    {priorityCfg.emoji} Priority: {priorityCfg.label}
                                </span>
                            )}
                        </div>
                        <BookingStatusBadge status={booking.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.date), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{booking.timeSlot.start} - {booking.timeSlot.end}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4" />
                            <span>{booking.userName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{booking.duration}h duration</span>
                        </div>
                    </div>

                    {/* Show rejection reason if rejected */}
                    {booking.status === 'rejected' && booking.rejectionReason && (
                        <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                            <p className="text-xs font-medium text-destructive mb-1">Rejection Reason:</p>
                            <p className="text-xs text-muted-foreground">{booking.rejectionReason}</p>
                        </div>
                    )}

                    {/* Show cancellation reason if cancelled */}
                    {booking.status === 'cancelled' && booking.cancellationReason && (
                        <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <p className="text-xs font-medium text-orange-600 mb-1">Cancellation Reason:</p>
                            <p className="text-xs text-muted-foreground">{booking.cancellationReason}</p>
                        </div>
                    )}

                    {/* Conflict Warning — visible to admins */}
                    {booking.conflictWarning?.hasConflict && (
                        <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-red-700">⚠️ Time Conflict Detected</p>
                                    {booking.conflictWarning.conflictDetails && (
                                        <p className="text-xs text-red-600 mt-0.5">
                                            {booking.conflictWarning.conflictDetails}
                                        </p>
                                    )}
                                    <p className="text-xs text-red-500 mt-1">
                                        Review both bookings before approving.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                            {/* Inline cancel reason form */}
                            {isCancelling && (
                                <div className="space-y-2 pb-2">
                                    <Label htmlFor={`cancel-reason-${booking.id}`}>Cancellation Reason *</Label>
                                    <Textarea
                                        id={`cancel-reason-${booking.id}`}
                                        placeholder="Please provide a reason for cancellation..."
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        rows={3}
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleConfirmCancel}
                                            size="sm"
                                            disabled={!cancellationReason.trim() || cancelMutation.isPending}
                                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                                        >
                                            <Ban className="h-4 w-4 mr-1" />
                                            Confirm Cancellation
                                        </Button>
                                        <Button
                                            onClick={() => { setIsCancelling(false); setCancellationReason(''); }}
                                            size="sm"
                                            variant="outline"
                                            disabled={cancelMutation.isPending}
                                            className="flex-1"
                                        >
                                            Back
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Reschedule, Cancel and Delete */}
                            {!isCancelling && (
                                <div className="flex gap-2 flex-wrap">
                                    {(() => {
                                        const bookingDate = new Date(booking.date);
                                        const [hours, minutes] = booking.timeSlot.end.split(':').map(Number);
                                        bookingDate.setHours(hours, minutes, 0, 0);
                                        const hasEnded = new Date() > bookingDate;

                                        if (!hasEnded && booking.status !== 'cancelled' && booking.status !== 'rejected') {
                                            return (
                                                <>
                                                    <Button
                                                        onClick={() => setRescheduleOpen(true)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Reschedule
                                                    </Button>
                                                    <Button
                                                        onClick={() => setIsCancelling(true)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                                    >
                                                        <Ban className="h-4 w-4 mr-1" />
                                                        Cancel
                                                    </Button>
                                                </>
                                            );
                                        }
                                        return null;
                                    })()}
                                    <Button
                                        onClick={() => setDeleteOpen(true)}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <RescheduleBookingDialog
                booking={booking}
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
            />
            <DeleteBookingDialog
                booking={booking}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </>
    );
}
