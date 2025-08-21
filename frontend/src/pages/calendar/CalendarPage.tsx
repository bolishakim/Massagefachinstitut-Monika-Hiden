import React, { useState, useEffect } from 'react';
import { format, startOfDay, addDays, subDays, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar, RefreshCw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DailyScheduleView } from '@/components/calendar/DailyScheduleView';
import { useAuth } from '@/hooks/useAuth';

export function CalendarPage() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');

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

      {/* Date Navigation */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
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
          
          <div className="text-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {format(currentDate, 'EEEE, d. MMMM yyyy', { locale: de })}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={calendarView === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCalendarView('day')}
            >
              Tag
            </Button>
            <Button
              variant={calendarView === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCalendarView('week')}
              disabled
            >
              Woche
            </Button>
            <Button
              variant={calendarView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCalendarView('month')}
              disabled
            >
              Monat
            </Button>
          </div>
        </div>
      </Card>

      {/* Daily Schedule View */}
      <DailyScheduleView 
        date={currentDate} 
        userId={user?.id}
        onRefresh={handleRefresh}
      />
    </div>
  );
}