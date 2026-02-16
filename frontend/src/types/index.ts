export type UserRole = 'admin' | 'infraAdmin' | 'itAdmin' | 'faculty' | 'department' | 'club' | 'infrastructure' | 'itService' | 'student';

export interface User {
  id: string;
  _id?: string; // MongoDB ID from backend
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  clubName?: string;
  isActive?: boolean;
}

export type ResourceType =
  | 'classroom'
  | 'lab'
  | 'department_library'
  | 'department_seminar_hall'
  | 'central_seminar_hall'
  | 'auditorium'
  | 'conference_room'
  | 'bus'
  | 'projector'
  | 'camera'
  | 'sound_system'
  | 'other_equipment'
  | 'speaker'
  | 'microphone'
  | 'laptop'
  | 'extension_cord'
  | 'podium'
  | 'others';

export type ResourceCategory = 'department' | 'central' | 'movable_asset';

export interface TimeSlot {
  label: string;
  duration: number; // in hours
  isDefault?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  category: ResourceCategory;
  capacity: number;
  location: string;
  amenities: string[];
  department?: string;
  isAvailable: boolean;
  requiresApproval?: boolean;
  maxBookingDuration?: number;
  customType?: string; // For when type is 'others'
  image?: string;
  availableTimeSlots?: TimeSlot[];
}

export type BookingStatus =
  | 'auto_approved'
  | 'pending_hod'
  | 'pending_admin'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type ApprovalLevel = 'none' | 'hod' | 'admin';

export type BookingType =
  | 'regular'
  | 'remedial'
  | 'project'
  | 'event'
  | 'industrial_visit'
  | 'other';

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Booking {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType?: ResourceType;
  resourceCategory?: ResourceCategory;
  userId: string;
  userName: string;
  userRole: UserRole;
  userDepartment?: string;
  date: string;
  timeSlot: TimeSlot;
  duration: number;
  purpose: string;
  bookingType: BookingType;
  status: BookingStatus;
  requiresApproval: boolean;
  approvalLevel: ApprovalLevel;
  approvedBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  approvedAt?: string;
  rejectedBy?: {
    id: string;
    name: string;
    role: UserRole;
  };
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  department?: string;
}

export interface DashboardStats {
  totalResources: number;
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  autoApprovedBookings?: number;
  rejectedBookings?: number;
}

