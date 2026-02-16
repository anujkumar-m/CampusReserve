import { useState, useEffect } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalCard } from '@/components/ApprovalCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Booking } from '@/types';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const { approveBooking, rejectBooking, getPendingApprovals } = useBooking();
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setIsLoading(true);
      const bookings = await getPendingApprovals();
      setPendingBookings(bookings);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    await approveBooking(id);
    await loadPendingApprovals(); // Refresh list
  };

  const handleReject = async (id: string, reason: string) => {
    await rejectBooking(id, reason);
    await loadPendingApprovals(); // Refresh list
  };

  if (!user) return null;

  const isAuthorized = user.role === 'infraAdmin' || user.role === 'itAdmin';

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = user.role === 'infraAdmin' || user.role === 'itAdmin';

  const stats = {
    pending: pendingBookings.length,
    hodPending: pendingBookings.filter((b) => b.status === 'pending_hod').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Booking Approvals</h1>
        <p className="text-muted-foreground">
          {user.role === 'department'
            ? `Review and approve booking requests for ${user.department} resources`
            : user.role === 'infraAdmin'
              ? 'Review and approve infrastructure booking requests'
              : user.role === 'itAdmin'
                ? 'Review and approve movable resource booking requests'
                : 'Review and manage booking requests'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="stat-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Total Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {user.role === 'department' && (
          <Card className="stat-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.hodPending}</p>
                  <p className="text-sm text-muted-foreground">HOD Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Pending Requests ({pendingBookings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-2 opacity-50 animate-spin" />
              <p>Loading pending approvals...</p>
            </div>
          ) : pendingBookings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pendingBookings.map((booking) => (
                <ApprovalCard
                  key={booking.id}
                  booking={booking}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No pending requests</p>
              <p className="text-sm mt-1">All bookings have been processed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
