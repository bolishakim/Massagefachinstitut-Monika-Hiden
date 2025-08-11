import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  X,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { roomsService, Room, RoomFilters, CreateRoomData } from '@/services/rooms';
import { PaginatedResponse } from '@/types';
import { CreateRoomModal } from '@/components/forms/CreateRoomModal';

export function RoomsManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginatedResponse<Room>['pagination']>();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Load rooms from backend
  const loadRooms = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading rooms from backend...');
      
      const filters: RoomFilters = {
        page,
        limit: 10,
        search: searchTerm || undefined,
        isActive: 'all'
      };
      
      console.log('Sending API request with filters:', filters);
      
      const response = await roomsService.getAllRooms(filters);
      
      console.log('API Response:', response);
      
      if (response.success && response.data) {
        setRooms(response.data);
        setPagination(response.pagination);
        console.log('Rooms loaded successfully:', response.data.length, 'rooms');
      } else {
        const errorMsg = response.error || 'Failed to load rooms';
        setError(errorMsg);
        console.error('Failed to load rooms:', errorMsg);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Network error while loading rooms');
    } finally {
      setLoading(false);
    }
  };

  // Load rooms on component mount and when search changes
  useEffect(() => {
    loadRooms();
  }, [searchTerm]);

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to delete room "${roomName}"?`)) {
      return;
    }
    
    try {
      const response = await roomsService.deleteRoom(roomId);
      
      if (response.success) {
        await loadRooms(); // Reload rooms after delete
      } else {
        setError(response.error || 'Failed to delete room');
      }
    } catch (err) {
      console.error('Error deleting room:', err);
      setError('Network error while deleting room');
    }
  };

  const handleCreateRoom = async (data: CreateRoomData) => {
    try {
      setCreating(true);
      const response = await roomsService.createRoom(data);
      
      if (response.success) {
        await loadRooms(); // Reload rooms after creation
        setShowCreateModal(false);
      } else {
        setError(response.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Error creating room:', err);
      setError('Network error while creating room');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Error</h4>
            <p className="text-sm">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            Räume verwalten
          </h1>
          <p className="text-muted-foreground">
            Verwalten Sie alle Behandlungsräume und Einrichtungen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadRooms()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" />
            Neuer Raum
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamt</p>
              <p className="text-2xl font-bold">{pagination?.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktiv</p>
              <p className="text-2xl font-bold">
                {(rooms || []).filter(r => r.isActive).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gesamtkapazität</p>
              <p className="text-2xl font-bold">
                {(rooms || []).reduce((sum, r) => sum + r.capacity, 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ø Kapazität</p>
              <p className="text-2xl font-bold">
                {(rooms || []).length > 0 
                  ? Math.round((rooms || []).reduce((sum, r) => sum + r.capacity, 0) / (rooms || []).length)
                  : 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Räume suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Rooms List */}
      <Card>
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Lade Räume...</p>
          </div>
        ) : (rooms || []).length === 0 ? (
          <div className="p-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Räume gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Versuchen Sie, die Suchbegriffe anzupassen.' : 'Erstellen Sie Ihren ersten Raum.'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Raum erstellen
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden">
            {/* Table Header */}
            <div className="bg-muted/50 p-4 border-b">
              <div className="grid grid-cols-12 gap-4 items-center text-sm font-medium text-muted-foreground">
                <div className="col-span-4">Raum</div>
                <div className="col-span-3">Ausstattung</div>
                <div className="col-span-1">Kapazität</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Aktionen</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-border">
              {(rooms || []).map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`p-4 hover:bg-muted/30 transition-colors ${
                    !room.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Room Info */}
                    <div className="col-span-4">
                      <div>
                        <h3 className={`font-medium ${
                          !room.isActive ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {room.name}
                        </h3>
                        {room.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="col-span-3">
                      <div className="flex flex-wrap gap-1">
                        {(room.features || []).slice(0, 3).map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {(room.features || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(room.features || []).length - 3} weitere
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Capacity */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        <span>{room.capacity}</span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs flex items-center gap-1 w-fit ${
                          room.isActive 
                            ? 'text-green-600 bg-green-100'
                            : 'text-red-600 bg-red-100'
                        }`}
                      >
                        {room.isActive ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Aktiv
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3" />
                            Inaktiv
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {}}
                        title="Raum bearbeiten"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRoom(room.id, room.name)}
                        className="text-destructive hover:text-destructive"
                        title="Raum löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === 1}
            onClick={() => loadRooms(pagination.page - 1)}
          >
            Zurück
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            Seite {pagination.page} von {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page === pagination.pages}
            onClick={() => loadRooms(pagination.page + 1)}
          >
            Weiter
          </Button>
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateRoom}
        isLoading={creating}
      />
    </div>
  );
}