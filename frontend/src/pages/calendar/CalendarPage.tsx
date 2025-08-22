import React, { useState, useEffect } from 'react';
import { format, startOfDay, addDays, subDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, RefreshCw, Settings, Filter, Users, Briefcase, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { DailyScheduleView } from '@/components/calendar/DailyScheduleView';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { calendarService } from '@/services/calendar';
import { StaffMember } from '@/types/calendar';

export function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  
  // Data from API
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [showStaffFilter, setShowStaffFilter] = useState(false);
  const [showServiceFilter, setShowServiceFilter] = useState(false);
  const [showRoomFilter, setShowRoomFilter] = useState(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Load staff, services, and rooms data
  useEffect(() => {
    loadFilterData();
  }, [currentDate]);

  const loadFilterData = async () => {
    try {
      // Load daily schedule which includes staff members
      const scheduleRes = await calendarService.getDailySchedule(currentDate);
      if (scheduleRes.success && scheduleRes.data) {
        console.log('Loaded staff members:', scheduleRes.data.staffMembers);
        const loadedStaff = scheduleRes.data.staffMembers || [];
        setStaffMembers(loadedStaff);
        
        // For now, use mock data for services and rooms until API endpoints are available
        const loadedServices = [
          { id: 'massage', name: 'Massage', category: 'MASSAGE' },
          { id: 'medical-massage', name: 'Medical Massage', category: 'MEDICAL' },
          { id: 'physiotherapy', name: 'Physiotherapy', category: 'PHYSIOTHERAPY' },
          { id: 'infrared', name: 'Infrared Chair', category: 'WELLNESS' },
        ];
        setServices(loadedServices);
        
        const loadedRooms = [
          { id: 'room1', name: 'Behandlungsraum 1' },
          { id: 'room2', name: 'Behandlungsraum 2' },
          { id: 'room3', name: 'Behandlungsraum 3' },
          { id: 'room4', name: 'Infrarot Kabine' },
        ];
        setRooms(loadedRooms);
        
        // Initialize all filters as selected if not already initialized
        if (!filtersInitialized) {
          setSelectedStaff(loadedStaff.map(s => s.id));
          setSelectedServices(loadedServices.map(s => s.id));
          setSelectedRooms(loadedRooms.map(r => r.id));
          setFiltersInitialized(true);
        }
      }
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  // Navigate to previous day
  const handlePreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  // Navigate to next day
  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1));
  };

  // Go to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    // Trigger data refresh in child components
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Handle staff selection
  const toggleStaffSelection = (staffId: string) => {
    console.log('Toggling staff selection for ID:', staffId);
    setSelectedStaff(prev => {
      const newSelection = prev.includes(staffId) 
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId];
      console.log('New staff selection:', newSelection);
      return newSelection;
    });
  };

  // Handle service selection
  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Handle room selection
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedStaff([]);
    setSelectedServices([]);
    setSelectedRooms([]);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedStaff.length > 0 || selectedServices.length > 0 || selectedRooms.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Terminkalender</h1>
          <p className="text-muted-foreground mt-1">
            Tagesübersicht der Mitarbeiter und Termine
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Einstellungen
          </Button>
        </div>
      </div>

      {/* Date Navigation and Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousDay}
              className="p-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant={isToday(currentDate) ? 'default' : 'outline'}
              size="sm"
              onClick={handleToday}
            >
              Heute
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextDay}
              className="p-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Current Date Display with Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <Input
              type="date"
              value={format(currentDate, 'yyyy-MM-dd')}
              onChange={(e) => setCurrentDate(new Date(e.target.value))}
              className="w-auto"
            />
            <span className="text-lg font-semibold">
              {format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}
            </span>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-background text-foreground rounded-full">
                  {selectedStaff.length + selectedServices.length + selectedRooms.length}
                </span>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </div>
        
        {/* Filter Options */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t space-y-4">
                {/* Staff Filter */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStaffFilter(!showStaffFilter)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Mitarbeiter filtern
                      {selectedStaff.length > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          {selectedStaff.length}
                        </span>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showStaffFilter ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {showStaffFilter && (
                    <div className="space-y-2">
                      <div className="flex justify-end gap-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStaff(staffMembers.map(s => s.id))}
                          className="text-xs"
                        >
                          Alle auswählen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStaff([])}
                          className="text-xs"
                        >
                          Alle abwählen
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-2 bg-muted/50 rounded-lg">
                        {staffMembers.length === 0 ? (
                          <div className="col-span-full text-center text-sm text-muted-foreground py-4">
                            Lade Mitarbeiter...
                          </div>
                        ) : (
                          staffMembers.map(staff => (
                            <Checkbox
                              key={staff.id}
                              id={`staff-${staff.id}`}
                              label={`${staff.firstName} ${staff.lastName}`}
                              description={staff.specialization}
                              checked={selectedStaff.includes(staff.id)}
                              onChange={() => toggleStaffSelection(staff.id)}
                              size="sm"
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Service Filter */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowServiceFilter(!showServiceFilter)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Dienstleistungen filtern
                      {selectedServices.length > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          {selectedServices.length}
                        </span>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showServiceFilter ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {showServiceFilter && (
                    <div className="space-y-2">
                      <div className="flex justify-end gap-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedServices(services.map(s => s.id))}
                          className="text-xs"
                        >
                          Alle auswählen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedServices([])}
                          className="text-xs"
                        >
                          Alle abwählen
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-muted/50 rounded-lg">
                        {services.map(service => (
                          <Checkbox
                            key={service.id}
                            id={`service-${service.id}`}
                            label={service.name}
                            checked={selectedServices.includes(service.id)}
                            onChange={() => toggleServiceSelection(service.id)}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Room Filter */}
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRoomFilter(!showRoomFilter)}
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Räume filtern
                      {selectedRooms.length > 0 && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                          {selectedRooms.length}
                        </span>
                      )}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showRoomFilter ? 'rotate-180' : ''}`} />
                  </Button>
                  
                  {showRoomFilter && (
                    <div className="space-y-2">
                      <div className="flex justify-end gap-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRooms(rooms.map(r => r.id))}
                          className="text-xs"
                        >
                          Alle auswählen
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRooms([])}
                          className="text-xs"
                        >
                          Alle abwählen
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2 bg-muted/50 rounded-lg">
                        {rooms.map(room => (
                          <Checkbox
                            key={room.id}
                            id={`room-${room.id}`}
                            label={room.name}
                            checked={selectedRooms.includes(room.id)}
                            onChange={() => toggleRoomSelection(room.id)}
                            size="sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Daily Schedule View */}
      <DailyScheduleView 
        date={currentDate} 
        userId={user?.id}
        onRefresh={handleRefresh}
        selectedStaffIds={selectedStaff}
        selectedServiceIds={selectedServices}
        selectedRoomIds={selectedRooms}
      />
    </div>
  );
}