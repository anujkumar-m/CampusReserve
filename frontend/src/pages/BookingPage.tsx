import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookingType, PriorityLevel } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Building2, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Priority mapping for booking types (admin-visible only)
export const BOOKING_TYPE_PRIORITY: Record<BookingType, PriorityLevel | null> = {
  exam: 'high',
  placement_drive: 'high',
  guest_lecture: 'medium',
  workshop: 'medium',
  club_activity: 'low',
  regular: null,
  remedial: null,
  project: null,
  event: null,
  industrial_visit: null,
  other: null,
};

export const PRIORITY_CONFIG: Record<PriorityLevel, { label: string; emoji: string; className: string }> = {
  high: { label: 'HIGH', emoji: '🔴', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  medium: { label: 'MEDIUM', emoji: '🟡', className: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
  low: { label: 'LOW', emoji: '🟢', className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
};

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resources, addBooking, getResourceById } = useBooking();
  const { user } = useAuth();

  const preselectedResourceId = searchParams.get('resource');

  const [selectedResourceId, setSelectedResourceId] = useState(preselectedResourceId || '');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(''); // Duration in hours as string
  const [purpose, setPurpose] = useState('');
  const [bookingType, setBookingType] = useState<BookingType>('regular');

  const selectedResource = selectedResourceId ? getResourceById(selectedResourceId) : null;
  const availableResources = resources.filter((r) => r.isAvailable);

  // Calculate duration in hours
  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return (endMinutes - startMinutes) / 60;
  };

  const duration = calculateDuration();

  // Auto-calculate end time when time slot or start time changes
  useEffect(() => {
    if (selectedTimeSlot && startTime) {
      const slotDuration = parseFloat(selectedTimeSlot);
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + slotDuration * 60;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;
      setEndTime(`${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`);
    }
  }, [selectedTimeSlot, startTime]);

  // Get available time slots for selected resource
  const getAvailableTimeSlots = () => {
    if (!selectedResource) return [];

    // Use resource's configured time slots if available
    if (selectedResource.availableTimeSlots && selectedResource.availableTimeSlots.length > 0) {
      return selectedResource.availableTimeSlots;
    }

    // Default time slots if none configured
    return [
      { label: '1 Hour', duration: 1, isDefault: true },
      { label: '2 Hours', duration: 2, isDefault: false },
      { label: 'Half Day', duration: 4, isDefault: false },
      { label: 'Full Day', duration: 8, isDefault: false },
    ];
  };

  // Get available booking types based on user role
  const getAvailableBookingTypes = () => {
    if (user?.role === 'student') {
      return [
        { value: 'regular' as BookingType, label: 'Regular' },
        { value: 'project' as BookingType, label: 'Project Work' },
        { value: 'club_activity' as BookingType, label: 'Club Activity' },
        { value: 'other' as BookingType, label: 'Others' },
      ];
    }
    if (user?.role === 'club') {
      return [
        { value: 'club_activity' as BookingType, label: 'Club Activity' },
        { value: 'workshop' as BookingType, label: 'Workshop' },
        { value: 'guest_lecture' as BookingType, label: 'Guest Lecture' },
        { value: 'other' as BookingType, label: 'Others' },
      ];
    }
    return [
      { value: 'regular' as BookingType, label: 'Regular' },
      { value: 'remedial' as BookingType, label: 'Remedial Class' },
      { value: 'project' as BookingType, label: 'Project Work' },
      { value: 'exam' as BookingType, label: 'Exam' },
      { value: 'placement_drive' as BookingType, label: 'Placement Drive' },
      { value: 'guest_lecture' as BookingType, label: 'Guest Lecture' },
      { value: 'workshop' as BookingType, label: 'Workshop' },
      { value: 'club_activity' as BookingType, label: 'Club Activity' },
      { value: 'event' as BookingType, label: 'Event' },
      { value: 'industrial_visit' as BookingType, label: 'Industrial Visit' },
      { value: 'other' as BookingType, label: 'Others' },
    ];
  };

  const isAdmin = ['admin', 'infraAdmin', 'itAdmin'].includes(user?.role || '');
  const currentPriority = BOOKING_TYPE_PRIORITY[bookingType];

  useEffect(() => {
    if (preselectedResourceId) {
      setSelectedResourceId(preselectedResourceId);
    }
  }, [preselectedResourceId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedResource || !date || !startTime || !endTime || !purpose || !user) {
      toast.error('Please fill in all fields');
      return;
    }

    // Student restriction for movable resources
    if (user.role === 'student' && selectedResource.category === 'movable_asset') {
      toast.error('Students are not allowed to book movable resources');
      return;
    }

    if (duration <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    const booking = {
      resourceId: selectedResource.id,
      date: format(date, 'yyyy-MM-dd'),
      timeSlot: {
        start: startTime,
        end: endTime,
      },
      purpose,
      bookingType,
    };

    addBooking(booking);
    toast.success('Booking request submitted successfully');
    navigate('/my-bookings');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {user?.role === 'student' ? 'Request Booking' :
            user?.role === 'club' ? 'Book Venue' : 'Book Resource'}
        </h1>
        <p className="text-muted-foreground">
          {user?.role === 'student'
            ? 'Submit a booking request for approval'
            : user?.role === 'faculty'
              ? 'Reserve a resource for your class'
              : 'Book a venue for your event'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Fill in the details for your booking request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Resource Selection */}
              <div className="space-y-2">
                <Label>Select Resource</Label>
                <Select value={selectedResourceId} onValueChange={setSelectedResourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a resource..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableResources.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {resource.name} • {resource.location}
                        {user?.role === 'student' && resource.category === 'movable_asset' && ' (NOT ALLOWED)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {user?.role === 'student' && selectedResource?.category === 'movable_asset' && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    🚫 Students are not allowed to book movable resources.
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slot and Time Selection */}
              <div className="space-y-4">
                {/* Time Slot Selection */}
                <div className="space-y-2">
                  <Label>Select Time Slot</Label>
                  <Select
                    value={selectedTimeSlot}
                    onValueChange={setSelectedTimeSlot}
                    disabled={!selectedResource}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose duration..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableTimeSlots().map((slot) => (
                        <SelectItem key={slot.duration} value={slot.duration.toString()}>
                          {slot.label} ({slot.duration}h)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedResource && (
                    <p className="text-xs text-muted-foreground">
                      Select a resource first to see available time slots
                    </p>
                  )}
                </div>

                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    disabled={!selectedTimeSlot}
                  />
                  {!selectedTimeSlot && (
                    <p className="text-xs text-muted-foreground">
                      Select a time slot first
                    </p>
                  )}
                </div>

                {/* Auto-calculated End Time */}
                {endTime && (
                  <div className="space-y-2">
                    <Label>End Time (Auto-calculated)</Label>
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                      <span className="text-sm font-medium">{endTime}</span>
                      <span className="text-xs text-muted-foreground">
                        ({duration} hour{duration !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  placeholder="Describe the purpose of your booking..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Booking Type */}
              <div className="space-y-2">
                <Label>Booking Type</Label>
                <Select value={bookingType} onValueChange={(value) => setBookingType(value as BookingType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select booking type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableBookingTypes().map((type) => {
                      const priority = BOOKING_TYPE_PRIORITY[type.value];
                      const priorityCfg = priority ? PRIORITY_CONFIG[priority] : null;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            {type.label}
                            {isAdmin && priorityCfg && (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border ${priorityCfg.className}`}>
                                {priorityCfg.emoji} {priorityCfg.label}
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {/* Admin-only priority indicator below select */}
                {isAdmin && currentPriority && (() => {
                  const cfg = PRIORITY_CONFIG[currentPriority];
                  return (
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md border w-fit ${cfg.className}`}>
                      <span>{cfg.emoji}</span>
                      <span>Priority: {cfg.label}</span>
                    </div>
                  );
                })()}
              </div>

              <Button type="submit" className="w-full" size="lg">
                {user?.role === 'faculty' ? 'Confirm Booking' : 'Submit Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resource Preview */}
        <div className="space-y-4">
          {selectedResource ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selected Resource</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground">{selectedResource.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selectedResource.type.replace('_', ' ')}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedResource.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>Capacity: {selectedResource.capacity}</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedResource.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a resource to see details</p>
              </CardContent>
            </Card>
          )}

          {/* Booking Summary */}
          {date && startTime && endTime && duration > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <h4 className="font-medium text-foreground mb-2">Booking Summary</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>📅 {format(date, 'EEEE, MMMM d, yyyy')}</p>
                  <p>🕐 {startTime} - {endTime}</p>
                  <p>⏱️ Duration: {duration} hour{duration !== 1 ? 's' : ''}</p>
                  {duration <= 1 && user?.role === 'student' && (
                    <p className="text-xs mt-2 text-success">
                      ✓ Auto-approval eligible (≤1 hour)
                    </p>
                  )}
                  {duration > 1 && user?.role === 'student' && (
                    <p className="text-xs mt-2 text-warning">
                      ⚠️ Requires HOD approval ({'>'}1 hour)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
