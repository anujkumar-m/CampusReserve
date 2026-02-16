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

interface ApprovalCardProps {
    booking: Booking;
    onApprove: (bookingId: string) => Promise<void>;
    onReject: (bookingId: string, reason: string) => Promise<void>;
}

export const ApprovalCard = ({ booking, onApprove, onReject }: ApprovalCardProps) => {
    const [isRejecting, setIsRejecting] = useState(false);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{booking.resourceType?.replace('_', ' ')}</Badge>
                                <Badge variant="secondary">{booking.bookingType}</Badge>
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
