import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingTypeService } from '@/services/bookingTypeService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tag, Plus, Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface BookingType {
    _id: string;
    name: string;
    value: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    isActive: boolean;
}

const PRIORITY_OPTIONS = [
    { value: 'high', label: 'High', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { value: 'medium', label: 'Medium', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    { value: 'low', label: 'Low', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
];

const priorityConfig = Object.fromEntries(PRIORITY_OPTIONS.map((p) => [p.value, p]));

interface FormState {
    name: string;
    value: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    isActive: boolean;
}

const emptyForm: FormState = { name: '', value: '', description: '', priority: 'medium', isActive: true };

export default function BookingTypesPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingType, setEditingType] = useState<BookingType | null>(null);
    const [deletingType, setDeletingType] = useState<BookingType | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [autoValue, setAutoValue] = useState(true);

    const { data: bookingTypes = [], isLoading } = useQuery<BookingType[]>({
        queryKey: ['booking-types'],
        queryFn: bookingTypeService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: bookingTypeService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking-types'] });
            sonnerToast.success('Booking type created successfully');
            setIsCreateOpen(false);
            setForm(emptyForm);
            setAutoValue(true);
        },
        onError: (err: any) => sonnerToast.error(err.response?.data?.message || 'Failed to create booking type'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => bookingTypeService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking-types'] });
            sonnerToast.success('Booking type updated successfully');
            setEditingType(null);
        },
        onError: (err: any) => sonnerToast.error(err.response?.data?.message || 'Failed to update booking type'),
    });

    const deleteMutation = useMutation({
        mutationFn: bookingTypeService.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['booking-types'] });
            sonnerToast.success('Booking type deleted successfully');
            setDeletingType(null);
        },
        onError: (err: any) => sonnerToast.error(err.response?.data?.message || 'Failed to delete booking type'),
    });

    const handleNameChange = (val: string) => {
        setForm((f) => ({
            ...f,
            name: val,
            value: autoValue
                ? val.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                : f.value,
        }));
    };

    const openEdit = (type: BookingType) => {
        setEditingType(type);
        setForm({ name: type.name, value: type.value, description: type.description, priority: type.priority, isActive: type.isActive });
        setAutoValue(false);
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(form);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingType) return;
        updateMutation.mutate({ id: editingType._id, data: form });
    };

    if (!['admin', 'infraAdmin', 'itAdmin'].includes(user?.role ?? '')) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Access denied. Admin only.</p>
            </div>
        );
    }

    const activeCount = bookingTypes.filter((t) => t.isActive).length;
    const highCount = bookingTypes.filter((t) => t.priority === 'high').length;

    const PriorityForm = () => (
        <div className="grid gap-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v: any) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                            <span className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${p.value === 'high' ? 'bg-red-500' : p.value === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />
                                {p.label}
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Tag className="h-6 w-6 text-primary" />
                        Booking Types
                    </h1>
                    <p className="text-muted-foreground mt-1">Define and manage booking categories with priority levels</p>
                </div>
                <Button onClick={() => { setForm(emptyForm); setAutoValue(true); setIsCreateOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Booking Type
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card className="stat-card">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-primary">{bookingTypes.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Total Types</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-green-500">{activeCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">Active</p>
                    </CardContent>
                </Card>
                <Card className="stat-card">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-red-500">{highCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">High Priority</p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Booking Types</CardTitle>
                    <CardDescription>Sorted by priority: High → Medium → Low</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p className="text-center text-muted-foreground py-8">Loading booking types...</p>
                    ) : bookingTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <Tag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p className="text-muted-foreground font-medium">No booking types yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Click "Add Booking Type" to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Column headers */}
                            <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                <div className="col-span-3">Name</div>
                                <div className="col-span-2">Value</div>
                                <div className="col-span-3">Description</div>
                                <div className="col-span-2">Priority</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-1 text-right">Actions</div>
                            </div>

                            {bookingTypes.map((type) => {
                                const pConfig = priorityConfig[type.priority];
                                return (
                                    <div
                                        key={type._id}
                                        className="grid grid-cols-12 gap-3 items-center px-4 py-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors border border-border/50"
                                    >
                                        {/* Name */}
                                        <div className="col-span-3">
                                            <p className="font-medium text-foreground text-sm">{type.name}</p>
                                        </div>

                                        {/* Value */}
                                        <div className="col-span-2">
                                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                                {type.value}
                                            </code>
                                        </div>

                                        {/* Description */}
                                        <div className="col-span-3">
                                            <p className="text-sm text-muted-foreground truncate" title={type.description}>
                                                {type.description || <span className="italic text-muted-foreground/50">—</span>}
                                            </p>
                                        </div>

                                        {/* Priority badge */}
                                        <div className="col-span-2">
                                            <Badge className={`text-xs capitalize border ${pConfig?.className ?? ''}`}>
                                                {pConfig?.label ?? type.priority}
                                            </Badge>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-1">
                                            {type.isActive ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(type)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setDeletingType(type)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Create Booking Type</DialogTitle>
                        <DialogDescription>Add a new booking category for the reservation system</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="create-name">Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="create-name"
                                placeholder="e.g. Guest Lecture"
                                value={form.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="create-value">
                                Value (key) <span className="text-xs text-muted-foreground">(auto-generated)</span>
                            </Label>
                            <Input
                                id="create-value"
                                placeholder="e.g. guest_lecture"
                                value={form.value}
                                onChange={(e) => {
                                    setAutoValue(false);
                                    setForm((f) => ({ ...f, value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }));
                                }}
                                required
                                pattern="[a-z0-9_]+"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="create-desc">Description</Label>
                            <Textarea
                                id="create-desc"
                                placeholder="Short description..."
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <PriorityForm />
                        <div className="flex items-center gap-3">
                            <Switch
                                id="create-active"
                                checked={form.isActive}
                                onCheckedChange={(val) => setForm((f) => ({ ...f, isActive: val }))}
                            />
                            <Label htmlFor="create-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit Booking Type</DialogTitle>
                        <DialogDescription>Update "{editingType?.name}"</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="edit-name">Name <span className="text-destructive">*</span></Label>
                            <Input
                                id="edit-name"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-value">Value (key)</Label>
                            <Input
                                id="edit-value"
                                value={form.value}
                                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                                required
                                pattern="[a-z0-9_]+"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="edit-desc">Description</Label>
                            <Textarea
                                id="edit-desc"
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                                rows={2}
                            />
                        </div>
                        <PriorityForm />
                        <div className="flex items-center gap-3">
                            <Switch
                                id="edit-active"
                                checked={form.isActive}
                                onCheckedChange={(val) => setForm((f) => ({ ...f, isActive: val }))}
                            />
                            <Label htmlFor="edit-active">Active</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingType(null)}>Cancel</Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deletingType} onOpenChange={(open) => !open && setDeletingType(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Booking Type?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <strong>"{deletingType?.name}"</strong>? This cannot be undone.
                            <br /><br />
                            <span className="text-orange-500 font-medium">⚠️ Note:</span> If this type is used in existing bookings, deletion will be blocked. Deactivate it instead.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => deletingType && deleteMutation.mutate(deletingType._id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
