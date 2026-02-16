import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/userService';
import { DEPARTMENT_LIST } from '@/constants/departments';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function FacultyOnboardingDialog() {
    const { user, loginWithGoogle } = useAuth(); // We might need a 'refreshUser' instead of loginWithGoogle
    // Actually, useAuth doesn't have a refreshUser. Let's assume we update it and then manually set it or force reload.
    const [selectedDept, setSelectedDept] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Show if faculty has no department
    const show = user?.role === 'faculty' && !user.department;

    const handleSubmit = async () => {
        if (!selectedDept || !user?.id) {
            toast.error('Please select your department');
            return;
        }

        setIsSubmitting(true);
        try {
            await userService.update(user.id, { department: selectedDept });
            toast.success('Department updated successfully');
            // Force a reload to refresh user data in context
            window.location.reload();
        } catch (error) {
            toast.error('Failed to update department');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={show} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        Welcome, {user?.name}! Please select your department to continue. This is required for resource booking.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="department">Department</Label>
                        <Select value={selectedDept} onValueChange={setSelectedDept}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPARTMENT_LIST.map((dept) => (
                                    <SelectItem key={dept.code} value={dept.value}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save and Continue'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
