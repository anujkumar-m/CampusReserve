import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { BookingCard } from '@/components/BookingCard';
import { ResourceCard } from '@/components/ResourceCard';
import FacultyOnboardingDialog from '@/components/FacultyOnboardingDialog';

export default function DashboardPage() {
  const { user } = useAuth();
  const { resources, bookings, getBookingsByUser, getPendingBookings, getBookingsByDepartment } = useBooking();

  if (!user) return null;

  const userBookings = getBookingsByUser(user.id);
  const pendingBookings = getPendingBookings();
  const departmentBookings = user.department ? getBookingsByDepartment(user.department) : [];

  const isAdmin = user.role === 'admin' || user.role === 'infraAdmin' || user.role === 'itAdmin' || user.role === 'infrastructure' || user.role === 'itService';

  // Note: Backend already filters bookings for infraAdmin and itAdmin, so we can use bookings array directly
  // for total counts. For department/faculty/student, we need to filter.

  const filteredResources = resources.filter((r) => {
    if (user.role === 'infraAdmin' || user.role === 'infrastructure') {
      return r.category !== 'movable_asset';
    }
    if (user.role === 'itAdmin' || user.role === 'itService') {
      return r.category === 'movable_asset';
    }
    return true;
  });

  const stats = {
    totalResources: filteredResources.length,
    availableResources: filteredResources.filter((r) => r.isAvailable).length,
    totalBookings: (isAdmin || user.role === 'department') ? bookings.length : userBookings.length,
    pendingCount: isAdmin || user.role === 'department'
      ? pendingBookings.length
      : userBookings.filter((b) => b.status === 'pending_hod' || b.status === 'pending_admin').length,
    approvedCount: (isAdmin || user.role === 'department')
      ? bookings.filter((b) => b.status === 'approved').length
      : userBookings.filter((b) => b.status === 'approved').length,
    rejectedCount: (isAdmin || user.role === 'department')
      ? bookings.filter((b) => b.status === 'rejected').length
      : userBookings.filter((b) => b.status === 'rejected').length,
  };

  const recentBookings = (isAdmin || user.role === 'department')
    ? bookings.slice(0, 5)
    : userBookings.slice(0, 5);

  const availableResourcesList = filteredResources.filter((r) => r.isAvailable);

  const getWelcomeMessage = () => {
    if (user.role === 'admin' || user.role === 'infraAdmin' || user.role === 'itAdmin') return 'Manage resources and oversee campus bookings.';
    if (user.role === 'faculty') return 'Book classrooms and labs for your lectures.';
    if (user.role === 'student') return 'Request resources for your academic activities.';
    if (user.role === 'department') return 'Manage department resources and approve requests.';
    if (user.role === 'club') return 'Book venues for your upcoming club events.';
    return 'Welcome to Campus Reserve.';
  };

  return (
    <div className="space-y-6">
      {/* Faculty Onboarding */}
      <FacultyOnboardingDialog />

      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {getWelcomeMessage()}
        </p>
      </div>



      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-card card-interactive">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Resources</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.availableResources}</p>
                <p className="text-xs text-muted-foreground mt-1">of {stats.totalResources} total</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-interactive">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {isAdmin ? 'Total Bookings' : 'Your Bookings'}
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.totalBookings}</p>
                <p className="text-xs text-muted-foreground mt-1">all time</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <Calendar className="h-6 w-6 text-secondary-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-interactive">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1">awaiting approval</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card card-interactive">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.approvedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">confirmed bookings</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {isAdmin ? 'Recent Bookings' :
                user.role === 'department' ? 'Department Requests' :
                  'Your Recent Bookings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentBookings.length > 0 ? (
              recentBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} compact />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No bookings yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Resources */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Available Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableResourcesList.length > 0 ? (
                  availableResourcesList.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} compact />
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    <p>No available resources</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
