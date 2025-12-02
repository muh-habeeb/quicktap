import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface SeatBlockingDemoProps {
  onClose?: () => void;
}

export default function SeatBlockingDemo({ onClose }: SeatBlockingDemoProps) {
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [blockedSeats, setBlockedSeats] = useState<number[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<Record<number, number>>({});

  // Simulate blocking a seat for 30 minutes
  const blockSeat = (seatNumber: number) => {
    if (blockedSeats.includes(seatNumber)) {
      toast.info(`Seat ${seatNumber} is already blocked`);
      return;
    }

    // Block seat for 30 minutes
    setBlockedSeats(prev => [...prev, seatNumber]);
    setBlockedTimes(prev => ({ ...prev, [seatNumber]: 30 }));
    
    toast.success(`Seat ${seatNumber} blocked for 30 minutes`);
    
    // Start countdown timer
    const timer = setInterval(() => {
      setBlockedTimes(prev => {
        const newTimes = { ...prev };
        if (newTimes[seatNumber] > 0) {
          newTimes[seatNumber] -= 1;
        } else {
          // Seat is no longer blocked
          setBlockedSeats(prevSeats => prevSeats.filter(s => s !== seatNumber));
          clearInterval(timer);
        }
        return newTimes;
      });
    }, 60000); // Update every minute
  };

  // Handle seat selection
  const handleSeatClick = (seatNumber: number) => {
    if (blockedSeats.includes(seatNumber)) {
      const timeRemaining = blockedTimes[seatNumber] || 0;
      toast.info(`Seat ${seatNumber} is blocked for ${timeRemaining} more minutes`);
      return;
    }

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
    } else {
      setSelectedSeats(prev => [...prev, seatNumber]);
    }
  };

  // Get seat status
  const getSeatStatus = (seatNumber: number) => {
    if (selectedSeats.includes(seatNumber)) {
      return 'selected';
    }
    if (blockedSeats.includes(seatNumber)) {
      return 'blocked';
    }
    return 'available';
  };

  // Get seat color
  const getSeatColor = (seatNumber: number) => {
    const status = getSeatStatus(seatNumber);
    switch (status) {
      case 'selected':
        return 'bg-accent text-accent-foreground border-accent';
      case 'blocked':
        return 'bg-destructive text-destructive-foreground border-destructive';
      default:
        return 'bg-primary text-primary-foreground border-primary hover:bg-primary/90';
    }
  };

  // Get seat cursor
  const getSeatCursor = (seatNumber: number) => {
    const status = getSeatStatus(seatNumber);
    return status === 'blocked' ? 'cursor-not-allowed' : 'cursor-pointer';
  };

  // Render seat grid
  const renderSeatGrid = () => {
    const rows = 5;
    const cols = 10;
    const seats = [];

    for (let row = 0; row < rows; row++) {
      const rowSeats = [];
      for (let col = 0; col < cols; col++) {
        const seatNumber = row * cols + col + 1;
        const status = getSeatStatus(seatNumber);
        const isBlocked = status === 'blocked';
        const timeRemaining = blockedTimes[seatNumber] || 0;
        
        rowSeats.push(
          <button
            key={seatNumber}
            onClick={() => handleSeatClick(seatNumber)}
            disabled={isBlocked}
            className={`
              w-10 h-10 rounded-lg border-2 font-medium text-xs transition-all relative
              ${getSeatColor(seatNumber)}
              ${getSeatCursor(seatNumber)}
              ${isBlocked ? 'opacity-80 shadow-inner' : 'hover:scale-105'}
            `}
            title={
              isBlocked 
                ? `Seat ${seatNumber} - BLOCKED\nExpires in ${timeRemaining} minutes\n\nThis seat cannot be selected for ${timeRemaining} more minutes.`
                : `Seat ${seatNumber} - ${status === 'selected' ? 'Selected' : 'Available'}`
            }
          >
            {seatNumber}
            {/* Show time remaining for blocked seats */}
            {isBlocked && timeRemaining > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white text-xs rounded-full flex items-center justify-center font-bold">
                {timeRemaining > 99 ? '∞' : timeRemaining}
              </div>
            )}
            {/* Show blocked indicator */}
            {isBlocked && (
              <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
              </div>
            )}
          </button>
        );
      }
      seats.push(
        <div key={row} className="flex gap-1 justify-center">
          {rowSeats}
        </div>
      );
    }
    return seats;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>🚫 Seat Blocking Demo - 30-Minute Protection</CardTitle>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close Demo
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          This demo shows how seats are blocked for 30 minutes after booking. 
          Blocked seats cannot be selected by other users.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="p-3 bg-secondary border border-primary/20 rounded-lg">
          <h4 className="font-medium text-primary mb-2">📋 How to Test:</h4>
          <ol className="text-sm text-primary space-y-1 list-decimal list-inside">
            <li>Click on any available seat to select it</li>
            <li>Click "Block Selected Seats" to simulate a 30-minute booking</li>
            <li>Try to click on blocked seats - they won't be selectable</li>
            <li>Watch the countdown timer - seats become available after 30 minutes</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (selectedSeats.length === 0) {
                toast.info('Please select seats first');
                return;
              }
              selectedSeats.forEach(seat => blockSeat(seat));
              setSelectedSeats([]);
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            🚫 Block Selected Seats (30 min)
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              setBlockedSeats([]);
              setBlockedTimes({});
              setSelectedSeats([]);
              toast.success('All seats unblocked');
            }}
          >
            🔓 Unblock All Seats
          </Button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-destructive rounded"></div>
            <span>Blocked (30 min)</span>
          </div>
        </div>

        {/* Seat Grid */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="space-y-1">
            {renderSeatGrid()}
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-primary">
              {50 - blockedSeats.length - selectedSeats.length}
            </div>
            <div className="text-sm text-primary/80">Available Seats</div>
          </div>
          
          <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-accent">
              {selectedSeats.length}
            </div>
            <div className="text-sm text-accent/80">Selected Seats</div>
          </div>
          
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <div className="text-2xl font-bold text-destructive">
              {blockedSeats.length}
            </div>
            <div className="text-sm text-destructive/80">Blocked Seats</div>
          </div>
        </div>

        {/* Blocked Seats Details */}
        {blockedSeats.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">🚫 Currently Blocked Seats:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {blockedSeats.map(seatNumber => {
                const timeRemaining = blockedTimes[seatNumber] || 0;
                const isExpiringSoon = timeRemaining <= 5;
                
                return (
                  <div
                    key={seatNumber}
                    className={`p-2 border rounded text-sm ${
                      isExpiringSoon 
                        ? 'bg-orange-50 border-orange-200' 
                        : 'bg-destructive/10 border-destructive/20'
                    }`}
                  >
                    <div className="font-medium">Seat {seatNumber}</div>
                    <div className={`font-bold ${
                      isExpiringSoon ? 'text-destructive' : 'text-destructive/50'
                    }`}>
                      {timeRemaining}m remaining
                    </div>
                    <div className="text-xs text-gray-600">
                      {isExpiringSoon ? 'Expiring soon!' : 'Blocked'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
