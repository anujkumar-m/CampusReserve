import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENT_LIST } from '@/constants/departments';
import { useAuth } from '@/contexts/AuthContext';

interface EditUserDialogProps {
    user: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: any) => void;
    isLoading?: boolean;
}

export function EditUserDialog({ user, open, onOpenChange, onSave, isLoading }: EditUserDialogProps) {
    const { user: currentUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [role, setRole] = useState(user?.role || 'student');
    const [selectedDepartment, setSelectedDepartment] = useState(user?.department || '');
    const [customDepartment, setCustomDepartment] = useState('');
    const [clubName, setClubName] = useState(user?.clubName || '');

    // Update state when user changes
    useEffect(() => {
        if (user) {
            setName(user.name);
            setRole(user.role);

            if (user.department) {
                const isDepartmentInList = DEPARTMENT_LIST.some(dept => dept.value === user.department);
                if (isDepartmentInList) {
                    setSelectedDepartment(user.department);
                    setCustomDepartment('');
                } else {
                    setSelectedDepartment('other');
                    setCustomDepartment(user.department);
                }
            }

            setClubName(user.clubName || '');
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updateData: any = {
            name,
            role,
        };

        if (['faculty', 'student', 'department'].includes(role)) {
            updateData.department = selectedDepartment === 'other' ? customDepartment : selectedDepartment;
        }

        if (role === 'club') {
            updateData.clubName = clubName;
        }

        onSave(updateData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user information and role assignments.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currentUser?.role === 'admin' && <SelectItem value="student">Student</SelectItem>}
                                    <SelectItem value="faculty">Faculty</SelectItem>
                                    <SelectItem value="department">Department</SelectItem>
                                    <SelectItem value="club">Club</SelectItem>
                                    <SelectItem value="infraAdmin">Infra Admin</SelectItem>
                                    <SelectItem value="itAdmin">IT Admin</SelectItem>
                                    <SelectItem value="infrastructure">Infrastructure Staff</SelectItem>
                                    <SelectItem value="itService">IT Service Staff</SelectItem>
                                    {currentUser?.role === 'admin' && <SelectItem value="admin">Main Admin</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>

                        {['faculty', 'student', 'department'].includes(role) && (
                            <div className="grid gap-2">
                                <Label htmlFor="edit-department">Department</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DEPARTMENT_LIST.map((dept) => (
                                            <SelectItem key={dept.code} value={dept.value}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="other">Other (Manual Entry)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {['faculty', 'student', 'department'].includes(role) && selectedDepartment === 'other' && (
                            <div className="grid gap-2">
                                <Label htmlFor="edit-customDepartment">Custom Department Name</Label>
                                <Input
                                    id="edit-customDepartment"
                                    placeholder="Enter department name"
                                    value={customDepartment}
                                    onChange={(e) => setCustomDepartment(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {role === 'club' && (
                            <div className="grid gap-2">
                                <Label htmlFor="edit-clubName">Club Name</Label>
                                <Input
                                    id="edit-clubName"
                                    placeholder="e.g., Tech Club"
                                    value={clubName}
                                    onChange={(e) => setClubName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
