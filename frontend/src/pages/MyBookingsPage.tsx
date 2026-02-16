import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from '@/components/BookingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { canCancelBooking } from '@/utils/bookingUtils';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const { getBookingsByUser, cancelBooking } = useBooking();

  if (!user) return null;

  const bookings = getBookingsByUser((user as any)._id || user.id);
  const pendingBookings = bookings.filter((b) => b.status === 'pending_hod' || b.status === 'pending_admin');
  const approvedBookings = bookings.filter((b) => b.status === 'approved' || b.status === 'auto_approved');
  const rejectedBookings = bookings.filter((b) => b.status === 'rejected');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(id);
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

