import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCard } from '@/components/BookingCard';
import { AdminBookingCard } from '@/components/AdminBookingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Search, X, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format, isSameDay, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export default function AllBookingsPage() {
  const { bookings } = useBooking();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Get all dates that have bookings for highlighting
  const bookedDates = useMemo(() => {
    return bookings.map(b => {
      try {
        return parseISO(b.date);
      } catch (e) {
        return new Date(0);
      }
    });
  }, [bookings]);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.resourceName.toLowerCase().includes(search.toLowerCase()) ||
      b.userName.toLowerCase().includes(search.toLowerCase()) ||
      b.purpose.toLowerCase().includes(search.toLowerCase());

    const matchesDate = !selectedDate || isSameDay(parseISO(b.date), selectedDate);

    // Role-based visibility: HODs see their own or their dept's bookings
    let matchesRole = true;
    if (user?.role === 'department') {
      const currentUserId = (user as any)._id || user.id;
      matchesRole = b.userId === currentUserId || b.department === user.department;
    }

    return matchesSearch && matchesDate && matchesRole;
  });

  const pendingBookings = filteredBookings.filter((b) =>
    b.status === 'pending_hod' || b.status === 'pending_admin' || b.status === 'auto_approved'
  );
  const approvedBookings = filteredBookings.filter((b) => b.status === 'approved');
  const rejectedBookings = filteredBookings.filter((b) => b.status === 'rejected');

  const isAdmin = ['admin', 'infraAdmin', 'itAdmin'].includes(user?.role || '');
  const BookingComponent = isAdmin ? AdminBookingCard : BookingCard;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Bookings</h1>
          <p className="text-muted-foreground text-sm">
            {isAdmin ? 'Manage all resource bookings across the system' : 'View all resource bookings across the system'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Calendar Trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "gap-2",
                  selectedDate && "border-primary bg-primary/5 text-primary"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Filter by Date'}
                {selectedDate && (
                  <div
                    className="ml-1 rounded-full bg-primary/10 p-0.5 hover:bg-primary/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(undefined);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                modifiers={{ booked: bookedDates }}
                modifiersStyles={{
                  booked: {
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))'
                  }
                }}
              />
            </PopoverContent>
          </Popover>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {selectedDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 px-3 rounded-lg border border-border/50 w-fit">
            <Filter className="h-3.5 w-3.5" />
            Showing bookings for <span className="font-medium text-foreground">{format(selectedDate, 'PPPP')}</span>
            <Badge variant="secondary" className="ml-2">
              {filteredBookings.length} Result{filteredBookings.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        )}

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="all" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
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

          <TabsContent value="all" className="space-y-4 pt-2">
            {filteredBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBookings.map((booking) => (
                  <BookingComponent key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState
                message={selectedDate ? `No bookings found for ${format(selectedDate, 'PPP')}` : "No bookings found"}
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 pt-2">
            {pendingBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBookings.map((booking) => (
                  <BookingComponent key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState message="No pending bookings found" />
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 pt-2">
            {approvedBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedBookings.map((booking) => (
                  <BookingComponent key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState message="No approved bookings found" />
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 pt-2">
            {rejectedBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rejectedBookings.map((booking) => (
                  <BookingComponent key={booking.id} booking={booking} />
                ))}
              </div>
            ) : (
              <EmptyState message="No rejected bookings found" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/10">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <CalendarIcon className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <p className="text-muted-foreground font-medium text-lg">{message}</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">Try adjusting your filters, selecting a different date, or searching for a different resource.</p>
    </div>
  );
}
