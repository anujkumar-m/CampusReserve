import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, GraduationCap, BookOpen, Building2, Sparkles, UserPlus, ShieldOff, ShieldCheck, Trash2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BlockUserDialog } from '@/components/BlockUserDialog';
import { DeleteUserDialog } from '@/components/DeleteUserDialog';
import { toast as sonnerToast } from 'sonner';
import { DEPARTMENT_LIST } from '@/constants/departments';
import { EditUserDialog } from '@/components/EditUserDialog';

const roleIcons = {
  admin: Building2,
  infraAdmin: ShieldCheck,
  itAdmin: ShieldCheck,
  faculty: BookOpen,
  student: GraduationCap,
  department: Users,
  club: Sparkles,
  infrastructure: Building2,
  itService: Building2,
};

const roleColors = {
  admin: 'bg-destructive/10 text-destructive',
  infraAdmin: 'bg-indigo-600/10 text-indigo-600',
  itAdmin: 'bg-indigo-600/10 text-indigo-600',
  faculty: 'bg-primary/10 text-primary',
  student: 'bg-success/10 text-success',
  department: 'bg-warning/10 text-warning',
  club: 'bg-accent/10 text-accent',
  infrastructure: 'bg-slate-500/10 text-slate-500',
  itService: 'bg-slate-500/10 text-slate-500',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [blockUserData, setBlockUserData] = useState<any>(null);
  const [deleteUserData, setDeleteUserData] = useState<any>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('student');
  const [department, setDepartment] = useState('');
  const [clubName, setClubName] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState('');

  // Edit user state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<string>('student');
  const [editSelectedDepartment, setEditSelectedDepartment] = useState<string>('');
  const [editCustomDepartment, setEditCustomDepartment] = useState('');
  const [editClubName, setEditClubName] = useState('');

  // Fetch all users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userService.getAllUsers,
    enabled: currentUser?.role === 'admin' || currentUser?.role === 'itAdmin',
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: roleService.assignRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'Role assigned successfully',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to assign role',
        variant: 'destructive',
      });
    },
  });

  // Unblock user mutation
  const unblockMutation = useMutation({
    mutationFn: (userId: string) => userService.unblock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      sonnerToast.success('User unblocked successfully');
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to unblock user');
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      sonnerToast.success('User updated successfully');
      setIsEditDialogOpen(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      sonnerToast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const resetForm = () => {
    setEmail('');
    setRole('student');
    setDepartment('');
    setClubName('');
    setSelectedDepartment('');
    setCustomDepartment('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    assignRoleMutation.mutate({
      email,
      role,
      department: ['faculty', 'student', 'department'].includes(role)
        ? (selectedDepartment === 'other' ? customDepartment : selectedDepartment)
        : undefined,
      clubName: role === 'club' ? clubName : undefined,
    });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (data: any) => {
    updateUserMutation.mutate({ id: editingUser._id || editingUser.id, data });
  };

  const usersByRole = {
    ...((currentUser?.role === 'admin') ? { admin: users.filter((u: any) => u.role === 'admin') } : {}),
    infraAdmin: users.filter((u: any) => u.role === 'infraAdmin'),
    itAdmin: users.filter((u: any) => u.role === 'itAdmin'),
    faculty: users.filter((u: any) => u.role === 'faculty'),
    ...((currentUser?.role === 'admin') ? { student: users.filter((u: any) => u.role === 'student') } : {}),
    department: users.filter((u: any) => u.role === 'department'),
    club: users.filter((u: any) => u.role === 'club'),
  };

  const filteredUsers = users.filter((u: any) => {
    if (currentUser?.role === 'itAdmin') {
      return u.role !== 'admin' && u.role !== 'student';
    }
    return true;
  });

  // Only admins and IT admins can access this page
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'itAdmin') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and assign roles
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User / Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add User or Assign Role</DialogTitle>
              <DialogDescription>
                Assign a role to a user by email. If the user doesn't exist, they'll be created when they sign in with Google.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
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
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                    >
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
                    <Label htmlFor="customDepartment">Custom Department Name</Label>
                    <Input
                      id="customDepartment"
                      placeholder="Enter department name"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      required
                    />
                  </div>
                )}

                {role === 'club' && (
                  <div className="grid gap-2">
                    <Label htmlFor="clubName">Club Name</Label>
                    <Input
                      id="clubName"
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
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignRoleMutation.isPending}>
                  {assignRoleMutation.isPending ? 'Assigning...' : 'Assign Role'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(usersByRole).map(([role, roleUsers]) => {
          const Icon = roleIcons[role as keyof typeof roleIcons];
          return (
            <Card key={role} className="stat-card">
              <CardContent className="p-4 text-center">
                <Icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{roleUsers.length}</p>
                <p className="text-xs text-muted-foreground capitalize">{role}s</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading users...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user: any) => {
                const Icon = roleIcons[user.role as keyof typeof roleIcons] || Users;
                const isBlocked = user.isActive === false;
                // Fix: backend returns _id, not id
                const isSelf = (user._id || user.id) === currentUser?.id;


                return (
                  <div
                    key={user._id || user.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback className={isBlocked ? "bg-destructive/20 text-destructive" : "bg-primary text-primary-foreground"}>
                          {user.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{user.name}</p>
                          {isBlocked && (
                            <Badge variant="destructive" className="text-xs">
                              Blocked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {user.department && (
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                          {user.department}
                        </span>
                      )}
                      {user.clubName && (
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                          {user.clubName}
                        </span>
                      )}
                      <Badge variant="secondary" className={roleColors[user.role as keyof typeof roleColors]}>
                        <Icon className="h-3 w-3 mr-1" />
                        <span className="capitalize">{user.role}</span>
                      </Badge>

                      {/* Admin Actions */}
                      {!isSelf && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {isBlocked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unblockMutation.mutate(user._id || user.id)}
                              disabled={unblockMutation.isPending}
                            >
                              <ShieldCheck className="h-4 w-4 mr-1" />
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setBlockUserData(user)}
                            >
                              <ShieldOff className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteUserData(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BlockUserDialog
        user={blockUserData}
        open={!!blockUserData}
        onOpenChange={(open) => !open && setBlockUserData(null)}
      />
      <DeleteUserDialog
        user={deleteUserData}
        open={!!deleteUserData}
        onOpenChange={(open) => !open && setDeleteUserData(null)}
      />
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={handleSaveEdit}
          isLoading={updateUserMutation.isPending}
        />
      )}
    </div>
  );
}
