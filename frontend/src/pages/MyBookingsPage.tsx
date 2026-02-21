import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from '@/components/BookingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { canCancelBooking } from '@/utils/bookingUtils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { getBookingsByUser, cancelBooking } = useBooking();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const bookings = getBookingsByUser((user as any)._id || user.id);
  const pendingBookings = bookings.filter((b) => b.status === 'pending_hod' || b.status === 'pending_admin');
  const approvedBookings = bookings.filter((b) => b.status === 'approved' || b.status === 'auto_approved');
  const rejectedBookings = bookings.filter((b) => b.status === 'rejected');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const handleCancel = (id: string) => {
    setPendingCancelId(id);
    setCancelReason('');
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!pendingCancelId || !cancelReason.trim()) return;
    setIsSubmitting(true);
    try {
      await cancelBooking(pendingCancelId, cancelReason.trim());
      setCancelDialogOpen(false);
    } finally {
      setIsSubmitting(false);
      setPendingCancelId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {user.role === 'club' ? 'Upcoming Events' : 'My Bookings'}
        </h1>
        <p className="text-muted-foreground">
          Track and manage your resource bookings
        </p>
      </div>



      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Calendar className="h-4 w-4" />
            All ({bookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="gap-2">
            <Ban className="h-4 w-4" />
            Cancelled ({cancelledBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {bookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancel}
                  showCancel={canCancelBooking(booking)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No bookings yet" />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancel}
                  showCancel={canCancelBooking(booking)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No pending bookings" />
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancel}
                  showCancel={canCancelBooking(booking)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No approved bookings" />
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rejectedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState message="No rejected bookings" />
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          {cancelledBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cancelledBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState message="No cancelled bookings" />
          )}
        </TabsContent>
      </Tabs>

      {/* Cancellation Reason Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={(open) => { if (!open) setCancelDialogOpen(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Cancel Booking
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this booking. This will be visible to the admin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-sm font-medium text-foreground">
              Cancellation Reason <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="e.g. Change in schedule, event postponed..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              className="resize-none"
              autoFocus
            />
            {cancelReason.length === 0 && (
              <p className="text-xs text-muted-foreground">Reason is required to cancel.</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isSubmitting}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim() || isSubmitting}
            >
              {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
      <p>{message}</p>
    </div>
  );
}

