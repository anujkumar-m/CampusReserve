import { useState } from 'react';
import { Booking } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Calendar, Clock, User, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { RescheduleBookingDialog } from './RescheduleBookingDialog';
import { DeleteBookingDialog } from './DeleteBookingDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingService } from '@/services/bookingService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AdminBookingCardProps {
    booking: Booking;
}

export function AdminBookingCard({ booking }: AdminBookingCardProps) {
    const { user } = useAuth();
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

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

    const handleReject = () => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            rejectMutation.mutate(reason);
        }
    };

    const isPending = booking.status === 'pending_hod' || booking.status === 'pending_admin' || booking.status === 'auto_approved';
    const isAdmin = ['admin', 'infraAdmin', 'itAdmin'].includes(user?.role || '');

    return (
        <>
            <Card className="card-interactive">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h3 className="font-semibold text-foreground">{booking.resourceName}</h3>
                            <p className="text-sm text-muted-foreground">{booking.purpose}</p>
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

                    {/* Admin Actions */}
                    {isAdmin && (
                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                            {/* Approve/Reject for pending bookings */}


                            {/* Reschedule and Delete */}
                            <div className="flex gap-2">
                                {(() => {
                                    const bookingDate = new Date(booking.date);
                                    const [hours, minutes] = booking.timeSlot.end.split(':').map(Number);
                                    bookingDate.setHours(hours, minutes, 0, 0);
                                    const hasEnded = new Date() > bookingDate;

                                    if (!hasEnded && booking.status !== 'cancelled' && booking.status !== 'rejected') {
                                        return (
                                            <Button
                                                onClick={() => setRescheduleOpen(true)}
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                            >
                                                <Edit className="h-4 w-4 mr-1" />
                                                Reschedule
                                            </Button>
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
