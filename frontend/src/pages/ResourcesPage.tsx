import { useState } from 'react';
import { useBooking } from '@/contexts/BookingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Resource, ResourceType, ResourceCategory, TimeSlot } from '@/types';
import { ResourceCard } from '@/components/ResourceCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Filter, X, Building2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { DEPARTMENT_LIST } from '@/constants/departments';

export default function ResourcesPage() {
  const { resources, addResource, updateResource, deleteResource } = useBooking();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ResourceType | 'all'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [customDepartment, setCustomDepartment] = useState('');

  // Default time slots
  const DEFAULT_TIME_SLOTS: TimeSlot[] = [
    { label: '1 Hour', duration: 1, isDefault: true, start: '09:00', end: '17:00' },
    { label: '2 Hours', duration: 2, isDefault: false, start: '09:00', end: '17:00' },
    { label: 'Half Day', duration: 4, isDefault: false, start: '09:00', end: '13:00' },
    { label: 'Full Day', duration: 8, isDefault: false, start: '09:00', end: '17:00' },
  ];

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [newSlotLabel, setNewSlotLabel] = useState('');
  const [newSlotDuration, setNewSlotDuration] = useState('');

  const isAdmin = user?.role === 'admin' || user?.role === 'infraAdmin' || user?.role === 'itAdmin' || user?.role === 'infrastructure' || user?.role === 'itService';
  const showTabs = user?.role !== 'student';

  // Helper to filter resources based on tab
  const getFilteredResources = (categoryFilter: 'my_dept' | 'infrastructure' | 'movable' | 'all') => {
    return resources.filter((resource) => {
      const matchesSearch = resource.name.toLowerCase().includes(search.toLowerCase()) ||
        resource.location.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || resource.type === typeFilter;

      // User specific restrictions
      if (user?.role === 'student' && user.department) {
        if (resource.department !== user.department) return false;
      }

      // For department (HOD) logic is handled by the tab functionality mostly, 
      // but we ensure they don't see Other Department's restricted items in the 'infrastructure' tab
      if (user?.role === 'department' && user.department) {
        if (resource.category === 'department' && resource.department !== user.department) return false;
      }

      // Tab Category Filter
      if (categoryFilter === 'my_dept') {
        // Strictly my department's resources
        if (resource.department !== user?.department) return false;
      }
      if (categoryFilter === 'infrastructure') {
        // All Fixed Resources (Central + My Dept)
        if (resource.category === 'movable_asset') return false;
      }
      if (categoryFilter === 'movable') {
        // All Movable Resources
        if (resource.category !== 'movable_asset') return false;
      }

      return matchesSearch && matchesType;
    });
  };

  const handleSaveResource = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const type = formData.get('type') as ResourceType;

    // Auto-determine category based on type
    let category: ResourceCategory;
    if (['classroom', 'lab', 'department_library', 'department_seminar_hall'].includes(type)) {
      category = 'department';
    } else if (['central_seminar_hall', 'auditorium', 'conference_room', 'bus'].includes(type)) {
      category = 'central';
    } else {
      category = 'movable_asset';
    }

    const resourceData: Resource = {
      id: editingResource?.id || `res-${Date.now()}`,
      name: formData.get('name') as string,
      type,
      category,
      capacity: parseInt(formData.get('capacity') as string),
      location: formData.get('location') as string,
      amenities: (formData.get('amenities') as string).split(',').map((a) => a.trim()),
      department: selectedDepartment === 'other'
        ? customDepartment
        : (selectedDepartment === 'none' ? undefined : selectedDepartment),
      isAvailable: true,
      availableTimeSlots: timeSlots.filter(slot => slot.isDefault !== false),
    };

    if (editingResource) {
      updateResource(editingResource.id, resourceData);
      toast.success('Resource updated successfully');
    } else {
      addResource(resourceData);
      toast.success('Resource added successfully');
    }

    setIsDialogOpen(false);
    setEditingResource(null);
    setTimeSlots(DEFAULT_TIME_SLOTS);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    // Check if department is in the predefined list
    const isDepartmentInList = DEPARTMENT_LIST.some(dept => dept.value === resource.department);
    if (isDepartmentInList) {
      setSelectedDepartment(resource.department || '');
      setCustomDepartment('');
    } else {
      setSelectedDepartment('other');
      setCustomDepartment(resource.department || '');
    }
    // Load existing time slots or use defaults
    if (resource.availableTimeSlots && resource.availableTimeSlots.length > 0) {
      setTimeSlots(resource.availableTimeSlots);
    } else {
      setTimeSlots(DEFAULT_TIME_SLOTS);
    }
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteResource(id);
    toast.success('Resource deleted successfully');
  };

  // Render Grid Helper
  const renderResourceGrid = (category: 'my_dept' | 'infrastructure' | 'movable' | 'all') => {
    const items = getFilteredResources(category);

    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>No resources found in this category.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            showActions={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">
            {user?.role === 'department'
              ? 'Manage your department resources'
              : 'Browse and book available resources'}
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingResource(null);
                setSelectedDepartment('');
                setCustomDepartment('');
                setTimeSlots(DEFAULT_TIME_SLOTS);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveResource} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Resource Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingResource?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue={editingResource?.type || 'classroom'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Infra Admin Options */}
                      {(user?.role === 'infraAdmin' || user?.role === 'infrastructure' || user?.role === 'admin') && (
                        <>
                          <SelectItem value="classroom">Classroom</SelectItem>
                          <SelectItem value="lab">Laboratory</SelectItem>
                          <SelectItem value="department_library">Department Library</SelectItem>
                          <SelectItem value="department_seminar_hall">Department Seminar Hall</SelectItem>
                          <SelectItem value="central_seminar_hall">Central Seminar Hall</SelectItem>
                          <SelectItem value="auditorium">Auditorium</SelectItem>
                          <SelectItem value="conference_room">Conference Room</SelectItem>
                          <SelectItem value="bus">Bus</SelectItem>
                        </>
                      )}

                      {/* IT Admin Options */}
                      {(user?.role === 'itAdmin' || user?.role === 'itService' || user?.role === 'admin') && (
                        <>
                          <SelectItem value="projector">Projector</SelectItem>
                          <SelectItem value="camera">Camera</SelectItem>
                          <SelectItem value="sound_system">Sound System</SelectItem>
                          <SelectItem value="speaker">Speaker</SelectItem>
                          <SelectItem value="microphone">Microphone</SelectItem>
                          <SelectItem value="laptop">Laptop</SelectItem>
                          <SelectItem value="extension_cord">Extension Cord</SelectItem>
                          <SelectItem value="podium">Podium</SelectItem>
                          <SelectItem value="other_equipment">Other Equipment</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      defaultValue={editingResource?.capacity}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select
                      value={selectedDepartment}
                      onValueChange={setSelectedDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {DEPARTMENT_LIST.map((dept) => (
                          <SelectItem key={dept.code} value={dept.value}>
                            {dept.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other (Manual Entry)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {selectedDepartment === 'other' && (
                  <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    defaultValue={editingResource?.location}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                  <Textarea
                    id="amenities"
                    name="amenities"
                    defaultValue={editingResource?.amenities.join(', ')}
                    placeholder="Projector, Whiteboard, AC"
                  />
                </div>

                {/* Time Slots Configuration */}
                <div className="space-y-3 border-t pt-4">
                  <Label>Available Time Slots</Label>
                  <p className="text-sm text-muted-foreground">
                    Select which booking durations are available for this resource
                  </p>

                  <div className="space-y-2">
                    {timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded border">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={`slot-${index}`}
                            checked={slot.isDefault !== false}
                            onCheckedChange={(checked) => {
                              const updated = [...timeSlots];
                              updated[index].isDefault = checked as boolean;
                              setTimeSlots(updated);
                            }}
                          />
                          <label htmlFor={`slot-${index}`} className="text-sm cursor-pointer">
                            {slot.label} ({slot.duration}h)
                          </label>
                        </div>
                        {index >= 4 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Custom Time Slot */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Label (e.g., 3 Hours)"
                      value={newSlotLabel}
                      onChange={(e) => setNewSlotLabel(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Hours"
                      value={newSlotDuration}
                      onChange={(e) => setNewSlotDuration(e.target.value)}
                      className="w-24"
                      step="0.5"
                      min="0.5"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newSlotLabel && newSlotDuration) {
                          setTimeSlots([...timeSlots, {
                            label: newSlotLabel,
                            duration: parseFloat(newSlotDuration),
                            isDefault: true,
                            start: '09:00', // Default start
                            end: '17:00'   // Default end
                          }]);
                          setNewSlotLabel('');
                          setNewSlotDuration('');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  {editingResource ? 'Update Resource' : 'Add Resource'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {showTabs ? (
        <Tabs
          defaultValue={
            ['infraAdmin', 'infrastructure'].includes(user?.role || '') ? 'infrastructure' :
              ['itAdmin', 'itService'].includes(user?.role || '') ? 'movable' :
                user?.role === 'faculty' ? 'infrastructure' :
                  'my_dept'
          }
          className="w-full space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <TabsList className={`grid w-full sm:w-[600px] ${['infraAdmin', 'infrastructure', 'itAdmin', 'itService'].includes(user?.role || '') ? 'grid-cols-1' :
              user?.role === 'faculty' ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
              {/* Department Tab: Hidden for Faculty, Infra, IT */}
              {!['faculty', 'infraAdmin', 'infrastructure', 'itAdmin', 'itService'].includes(user?.role || '') && (
                <TabsTrigger value="my_dept" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Department
                </TabsTrigger>
              )}

              {/* All Fixed Tab: Hidden for IT Admin */}
              {!['itAdmin', 'itService'].includes(user?.role || '') && (
                <TabsTrigger value="infrastructure" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  Infrastructure
                </TabsTrigger>
              )}

              {/* Movable Tab: Hidden for Infra Admin */}
              {!['infraAdmin', 'infrastructure'].includes(user?.role || '') && (
                <TabsTrigger value="movable" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <Camera className="h-4 w-4 mr-2" />
                  Movable
                </TabsTrigger>
              )}
            </TabsList>

            {/* Shared Search/Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | 'all')}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="classroom">Classrooms</SelectItem>
                  <SelectItem value="lab">Laboratories</SelectItem>
                  <SelectItem value="projector">Projectors</SelectItem>
                  {/* ... other items can be added dynamically or statically if needed, but 'All Types' covers most users */}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="my_dept" className="space-y-4">
            {renderResourceGrid('my_dept')}
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4">
            {renderResourceGrid('infrastructure')}
          </TabsContent>

          <TabsContent value="movable" className="space-y-4">
            {renderResourceGrid('movable')}
          </TabsContent>
        </Tabs>
      ) : (
        // Non-tabbed view for students/dept
        <div className="space-y-4">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {/* Filter added for non-tabbed view as well */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as ResourceType | 'all')}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="classroom">Classrooms</SelectItem>
                <SelectItem value="lab">Laboratories</SelectItem>
                <SelectItem value="projector">Projectors</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderResourceGrid('all')}
        </div>
      )}
    </div>
  );
}
