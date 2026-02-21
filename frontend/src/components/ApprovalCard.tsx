import { useState } from 'react';
import { Booking } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookingStatusBadge } from './BookingStatusBadge';
import { Calendar, Clock, MapPin, User, Building2, AlertTriangle, Edit } from 'lucide-react';
import { RescheduleBookingDialog } from './RescheduleBookingDialog';
import { format } from 'date-fns';
import { canApproveBooking } from '@/utils/bookingUtils';
import { BOOKING_TYPE_PRIORITY, PRIORITY_CONFIG } from '@/pages/BookingPage';
import { useAuth } from '@/contexts/AuthContext';

interface ApprovalCardProps {
    booking: Booking;
    onApprove: (bookingId: string) => Promise<void>;
    onReject: (bookingId: string, reason: string) => Promise<void>;
}

export const ApprovalCard = ({ booking, onApprove, onReject }: ApprovalCardProps) => {
    const { user } = useAuth();
    const [isRejecting, setIsRejecting] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const isAdmin = ['admin', 'infraAdmin', 'itAdmin'].includes(user?.role || '');
    const priority = BOOKING_TYPE_PRIORITY[booking.bookingType];
    const priorityCfg = priority ? PRIORITY_CONFIG[priority] : null;

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            await onApprove(booking.id);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            return;
        }
        setIsLoading(true);
        try {
            await onReject(booking.id, rejectionReason);
            setIsRejecting(false);
            setRejectionReason('');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl">{booking.resourceName}</CardTitle>
                        <CardDescription>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline">{booking.resourceType?.replace('_', ' ')}</Badge>
                                <Badge variant="secondary">{booking.bookingType.replace(/_/g, ' ')}</Badge>
                                {isAdmin && priorityCfg && (
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${priorityCfg.className}`}>
                                        {priorityCfg.emoji} Priority: {priorityCfg.label}
                                    </span>
                                )}
                            </div>
                        </CardDescription>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{booking.userName}</p>
                            <p className="text-xs text-muted-foreground">{booking.userRole} {booking.userDepartment && `• ${booking.userDepartment}`}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{format(new Date(booking.date), 'PPP')}</p>
                            <p className="text-xs text-muted-foreground">
                                {booking.timeSlot.start} - {booking.timeSlot.end} ({booking.duration}h)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <p className="font-medium text-muted-foreground text-xs">Requested on</p>
                            <p className="font-semibold">{format(new Date(booking.createdAt), 'PPP')}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(booking.createdAt), 'hh:mm a')}</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                            <p className="font-medium">Purpose</p>
                            <p className="text-muted-foreground">{booking.purpose}</p>
                        </div>
                    </div>
                </div>

                {/* Conflict Warning — shown prominently before approve/reject */}
                {booking.conflictWarning?.hasConflict && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-bold text-red-700">⚠️ Time Conflict Detected</p>
                                <p className="text-xs text-red-600 mt-1">
                                    This booking overlaps with another existing booking for the same resource.
                                </p>
                                {booking.conflictWarning.conflictDetails && (
                                    <p className="text-xs font-mono text-red-500 mt-1 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded">
                                        {booking.conflictWarning.conflictDetails}
                                    </p>
                                )}
                                <p className="text-xs text-red-600 font-semibold mt-2">
                                    ⚡ Please review both bookings and reject the lower-priority one.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isRejecting && (
                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                        <Textarea
                            id="rejection-reason"
                            placeholder="Please provide a reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex gap-2">
                {!canApproveBooking(booking) ? (
                    <div className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">This booking is in the past and cannot be approved</span>
                    </div>
                ) : !isRejecting ? (
                    <>
                        <Button
                            onClick={handleApprove}
                            disabled={isLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            Approve
                        </Button>
                        {(() => {
                            const bookingDate = new Date(booking.date);
                            const [hours, minutes] = booking.timeSlot.end.split(':').map(Number);
                            bookingDate.setHours(hours, minutes, 0, 0);
                            const hasEnded = new Date() > bookingDate;

                            if (!hasEnded) {
                                return (
                                    <Button
                                        onClick={() => setRescheduleOpen(true)}
                                        disabled={isLoading}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Reschedule
                                    </Button>
                                );
                            }
                            return null;
                        })()}
                        <Button
                            onClick={() => setIsRejecting(true)}
                            disabled={isLoading}
                            variant="destructive"
                            className="flex-1"
                        >
                            Reject
                        </Button>
                    </>
                ) : (
                    <>
                        <Button
                            onClick={handleReject}
                            disabled={isLoading || !rejectionReason.trim()}
                            variant="destructive"
                            className="flex-1"
                        >
                            Confirm Rejection
                        </Button>
                        <Button
                            onClick={() => {
                                setIsRejecting(false);
                                setRejectionReason('');
                            }}
                            disabled={isLoading}
                            variant="outline"
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                    </>
                )}
            </CardFooter>
            <RescheduleBookingDialog
                booking={booking}
                open={rescheduleOpen}
                onOpenChange={setRescheduleOpen}
            />
        </Card >
    );
};
