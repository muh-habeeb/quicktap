import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SeatService, SeatStatus } from '@/services/seatService';

interface SeatManagementProps {
  selectedSeats: number[];
  onSeatSelect: (seatNumber: number) => void;
  onSeatDeselect: (seatNumber: number) => void;
  disabled?: boolean;
}

export default function SeatManagement({
  selectedSeats,
  onSeatSelect,
  onSeatDeselect,
  disabled = false
}: SeatManagementProps) {
  const [seatStatus, setSeatStatus] = useState<SeatStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch seat status
  const fetchSeatStatus = async () => {
    try {
      const response = await SeatService.getSeatStatus();
      setSeatStatus(response.seats);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error('Failed to load seat status');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSeatStatus();
  }, []);

  // Auto-refresh every 15 seconds for better real-time updates
  useEffect(() => {
    const interval = setInterval(fetchSeatStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle seat click
  const handleSeatClick = (seat: SeatStatus) => {
    if (disabled) return;
    
    // ENHANCED: Check if seat is blocked/occupied
    if (seat.status === 'occupied' || isSeatBlocked(seat)) {
      const timeRemaining = seat.booking?.timeRemaining || 0;
      if (timeRemaining > 0) {
        toast.info(`Seat ${seat.seatNumber} is blocked for ${timeRemaining} more minutes`);
      } else {
        toast.info(`Seat ${seat.seatNumber} is occupied`);
      }
      return;
    }

    if (selectedSeats.includes(seat.seatNumber)) {
      onSeatDeselect(seat.seatNumber);
    } else {
      onSeatSelect(seat.seatNumber);
    }
  };

  // NEW: Check if seat is blocked (occupied or recently booked)
  const isSeatBlocked = (seat: SeatStatus): boolean => {
    return seat.status === 'occupied' || 
           (seat.booking && seat.booking.timeRemaining && seat.booking.timeRemaining > 0);
  };

  // ENHANCED: Get seat status color with better visual distinction
  const getSeatStatusColor = (seat: SeatStatus) => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return 'bg-primary text-primary-foreground border-primary';
    }
    
    if (isSeatBlocked(seat)) {
      // Different colors based on time remaining
      const timeRemaining = seat.booking?.timeRemaining || 0;
      if (timeRemaining <= 5) {
        return 'bg-orange-500 text-white border-orange-500'; // Almost expired
      } else if (timeRemaining <= 15) {
        return 'bg-yellow-500 text-black border-yellow-500'; // Medium time
      } else {
        return 'bg-destructive text-destructive-foreground border-destructive'; // Long time remaining
      }
    }
    
    return 'bg-primary text-primary-foreground border-primary hover:bg-primary/90';
  };

  // ENHANCED: Get seat status text with more detail
  const getSeatStatusText = (seat: SeatStatus) => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return 'Selected';
    }
    
    if (isSeatBlocked(seat)) {
      const timeRemaining = seat.booking?.timeRemaining || 0;
      if (timeRemaining > 0) {
        return `${timeRemaining}m`;
      }
      return 'Occupied';
    }
    
    return 'Available';
  };

  // NEW: Get seat tooltip with detailed information
  const getSeatTooltip = (seat: SeatStatus): string => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return `Seat ${seat.seatNumber} - Selected`;
    }
    
    if (isSeatBlocked(seat)) {
      const timeRemaining = seat.booking?.timeRemaining || 0;
      const userName = seat.booking?.userName || 'Guest User';
      const orderId = seat.booking?.orderId || 'Unknown';
      
      if (timeRemaining > 0) {
        return `Seat ${seat.seatNumber} - BLOCKED\nBooked by: ${userName}\nOrder: ${orderId}\nExpires in: ${timeRemaining} minutes\n\nThis seat cannot be selected for ${timeRemaining} more minutes.`;
      }
      return `Seat ${seat.seatNumber} - Occupied\nBooked by: ${userName}\nOrder: ${orderId}`;
    }
    
    return `Seat ${seat.seatNumber} - Available\nClick to select this seat`;
  };

  // ENHANCED: Render seat grid with better visual blocking
  const renderSeatGrid = () => {
    const rows = 10;
    const cols = 10;
    const seats = [];

    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < cols; col++) {
        const seatNumber = row * cols + col + 1;
        const seat = seatStatus.find(s => s.seatNumber === seatNumber);
        
        if (seat) {
          const isBlocked = isSeatBlocked(seat);
          const timeRemaining = seat.booking?.timeRemaining || 0;
          
          rowSeats.push(
            <button
              key={seatNumber}
              onClick={() => handleSeatClick(seat)}
              disabled={disabled || isBlocked}
              className={`
                w-12 h-12 rounded-lg border-2 font-medium text-sm transition-all relative
                ${getSeatStatusColor(seat)}
                ${disabled || isBlocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:scale-105'}
                ${selectedSeats.includes(seatNumber) ? 'ring-2 ring-offset-2 ring-primary' : ''}
                ${isBlocked ? 'shadow-inner' : ''}
              `}
              title={getSeatTooltip(seat)}
            >
              {seatNumber}
              {/* NEW: Show time remaining overlay for blocked seats */}
              {isBlocked && timeRemaining > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {timeRemaining > 99 ? '∞' : timeRemaining}
                </div>
              )}
              {/* NEW: Show blocked indicator */}
              {isBlocked && (
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full opacity-60"></div>
                </div>
              )}
            </button>
          );
        }
      }
      seats.push(
        <div key={row} className="flex gap-2 justify-center">
          {rowSeats}
        </div>
      );
    }
    return seats;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seat Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading seat status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableSeats = seatStatus.filter(s => s.status === 'available').length;
  const occupiedSeats = seatStatus.filter(s => s.status === 'occupied').length;
  const blockedSeats = seatStatus.filter(s => isSeatBlocked(s)).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Seat Management</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSeatStatus}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Available ({availableSeats})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span>Blocked ({blockedSeats})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Selected ({selectedSeats.length})</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()} | Auto-refresh every 15 seconds
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* NEW: Blocked Seats Warning */}
          {blockedSeats > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-medium text-destructive mb-2">⚠️ Blocked Seats</h4>
              <p className="text-sm text-destructive/80">
                {blockedSeats} seats are currently blocked and cannot be selected. 
                They will become available after their 30-minute booking period expires.
              </p>
            </div>
          )}

          {/* Seat Grid */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="space-y-2">
              {renderSeatGrid()}
            </div>
          </div>

          {/* Selected Seats Summary */}
          {selectedSeats.length > 0 && (
            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-primary mb-2">Selected Seats:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map(seatNumber => (
                  <Badge
                    key={seatNumber}
                    variant="secondary"
                    className="bg-primary text-primary-foreground"
                  >
                    Seat {seatNumber}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* ENHANCED: Blocked Seats with Time Remaining */}
          {blockedSeats > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Blocked Seats - Time Remaining:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {seatStatus
                  .filter(s => isSeatBlocked(s) && s.booking?.timeRemaining && s.booking.timeRemaining > 0)
                  .sort((a, b) => (a.booking?.timeRemaining || 0) - (b.booking?.timeRemaining || 0))
                  .slice(0, 9)
                  .map(seat => {
                    const timeRemaining = seat.booking?.timeRemaining || 0;
                    const isExpiringSoon = timeRemaining <= 5;
                    
                    return (
                      <div
                        key={seat.seatNumber}
                        className={`p-2 border rounded text-sm ${
                          isExpiringSoon 
                            ? 'bg-orange-50 border-orange-200' 
                            : 'bg-destructive/10 border-destructive/20'
                        }`}
                      >
                        <div className="font-medium">Seat {seat.seatNumber}</div>
                        <div className={`font-bold ${
                          isExpiringSoon ? 'text-destructive' : 'text-destructive/50'
                        }`}>
                          {timeRemaining}m remaining
                        </div>
                        <div className="text-xs text-gray-600">
                          {seat.booking?.userName || 'Guest User'}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
