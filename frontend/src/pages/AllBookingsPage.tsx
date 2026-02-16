import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from '@/components/BookingCard';
import { AdminBookingCard } from '@/components/AdminBookingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calendar, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { useState } from 'react';

export default function AllBookingsPage() {
  const { bookings } = useBooking();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const filteredBookings = bookings.filter((b) =>
    b.resourceName.toLowerCase().includes(search.toLowerCase()) ||
    b.userName.toLowerCase().includes(search.toLowerCase()) ||
    b.purpose.toLowerCase().includes(search.toLowerCase())
  );

  const pendingBookings = filteredBookings.filter((b) =>
    b.status === 'pending_hod' || b.status === 'pending_admin' || b.status === 'auto_approved'
  );
  const approvedBookings = filteredBookings.filter((b) => b.status === 'approved');
  const rejectedBookings = filteredBookings.filter((b) => b.status === 'rejected');

  const isAdmin = ['admin', 'infraAdmin', 'itAdmin'].includes(user?.role || '');
  const BookingComponent = isAdmin ? AdminBookingCard : BookingCard;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Bookings</h1>
        <p className="text-muted-foreground">
          {isAdmin ? 'Manage all resource bookings across the system' : 'View all resource bookings across the system'}
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            <Calendar className="h-4 w-4" />
            All ({filteredBookings.length})
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
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBookings.map((booking) => (
                <BookingComponent key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState message="No bookings found" />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBookings.map((booking) => (
                <BookingComponent key={booking.id} booking={booking} />
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
                <BookingComponent key={booking.id} booking={booking} />
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
                <BookingComponent key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <EmptyState message="No rejected bookings" />
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
