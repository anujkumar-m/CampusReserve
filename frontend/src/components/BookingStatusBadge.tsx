import { Badge } from '@/components/ui/badge';
import { BookingStatus } from '@/types';
import { CheckCircle2, Clock, XCircle, Ban } from 'lucide-react';

interface BookingStatusBadgeProps {
    status: BookingStatus;
}

export const BookingStatusBadge = ({ status }: BookingStatusBadgeProps) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'auto_approved':
                return {
                    label: 'Auto Approved',
                    variant: 'default' as const,
                    icon: CheckCircle2,
                    className: 'bg-green-500 hover:bg-green-600 text-white'
                };
            case 'approved':
                return {
                    label: 'Approved',
                    variant: 'default' as const,
                    icon: CheckCircle2,
                    className: 'bg-green-500 hover:bg-green-600 text-white'
                };
            case 'pending_hod':
                return {
                    label: 'Pending HOD Approval',
                    variant: 'secondary' as const,
                    icon: Clock,
                    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'
                };
            case 'pending_admin':
                return {
                    label: 'Pending Admin Approval',
                    variant: 'secondary' as const,
                    icon: Clock,
                    className: 'bg-orange-500 hover:bg-orange-600 text-white'
                };
            case 'rejected':
                return {
                    label: 'Rejected',
                    variant: 'destructive' as const,
                    icon: XCircle,
                    className: 'bg-red-500 hover:bg-red-600 text-white'
                };
            case 'cancelled':
                return {
                    label: 'Cancelled',
                    variant: 'outline' as const,
                    icon: Ban,
                    className: 'bg-gray-400 hover:bg-gray-500 text-white'
                };
            default:
                return {
                    label: status,
                    variant: 'outline' as const,
                    icon: Clock,
                    className: ''
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
            <Icon className="h-3 w-3" />
            {config.label}
        </Badge>
    );
};
