import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { API_URL } from '@/api';

interface BookingStats {
  total: number;
  active: number;
  expired: number;
  completed: number;
  recent24h: number;
  // NEW: Payment verification stats
  paymentVerified?: number;
  pendingPayment?: number;
  temporaryReservations?: number;
  cashBookings?: number; // Added cashBookings to BookingStats
}

interface Booking {
  _id: string;
  seatNumber: number;
  orderId: string;
  userId?: string;
  userName?: string;
  status: string;
  bookedAt: string;
  expiresAt: string;
  orderDetails?: any;
  // NEW: Payment verification fields
  paymentVerified?: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paymentStatus?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  isTemporary?: boolean;
}

export default function SeatAdminDashboard() {
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Fetch booking statistics
  const fetchStats = async () => {
    try {
      console.log('Fetching stats from: http://localhost:5000/api/seats/admin/stats');
      const response = await fetch(`${API_URL}/api/seats/admin/stats`);
      console.log('Stats response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stats response error:', errorText);
        throw new Error('Failed to fetch stats');
      }
      
      const data = await response.json();
      console.log('Stats data received:', data);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load booking statistics');
    }
  };

  // Debug: Log when bookings state changes
  useEffect(() => {
    console.log('Bookings state changed:', bookings);
    console.log('Bookings length:', bookings.length);
    if (bookings.length > 0) {
      console.log('First booking in state:', bookings[0]);
      console.log('First booking seatNumber in state:', bookings[0].seatNumber);
    }
  }, [bookings]);

  // Fetch bookings
  const fetchBookings = async (page = 1) => {
    try {
      const statusQuery = selectedStatus ? `&status=${selectedStatus}` : '';
      const url = `http://localhost:5000/api/seats/admin/all?page=${page}&limit=20${statusQuery}`;
      
      console.log('Fetching bookings from:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      console.log('Bookings data received:', data);
      console.log('Bookings array:', data.bookings);
      console.log('First booking:', data.bookings[0]);
      console.log('First booking seatNumber:', data.bookings[0]?.seatNumber);
      
      if (!data.bookings || !Array.isArray(data.bookings)) {
        console.error('Invalid bookings data:', data);
        toast.error('Invalid data received from server');
        return;
      }
      
      setBookings(data.bookings);
      setTotalPages(data.pagination.totalPages);
      setCurrentPage(data.pagination.currentPage);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  // Force expire bookings for an order
  const expireBookings = async (orderId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/seats/admin/expire/${orderId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to expire bookings');
      
      toast.success('Bookings expired successfully');
      fetchBookings(currentPage);
      fetchStats();
    } catch (error) {
      toast.error('Failed to expire bookings');
    }
  };

  // Update existing bookings with user information
  const updateUserInfo = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/seats/admin/update-user-info', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to update user info');
      
      const data = await response.json();
      toast.success(data.message);
      fetchBookings(currentPage);
      fetchStats();
    } catch (error) {
      toast.error('Failed to update user information');
    }
  };

  // Create a test user and update bookings
  const createTestUserAndUpdate = async () => {
    try {
      // First create a test user
      const createUserResponse = await fetch('http://localhost:5000/api/seats/admin/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'testuser@gmail.com',
          name: 'Test User'
        })
      });
      
      if (!createUserResponse.ok) throw new Error('Failed to create test user');
      
      // Then update the bookings
      const updateResponse = await fetch('http://localhost:5000/api/seats/admin/update-user-info', {
        method: 'POST',
      });
      
      if (!updateResponse.ok) throw new Error('Failed to update user info');
      
      const data = await updateResponse.json();
      toast.success(`Test user created and ${data.message}`);
      fetchBookings(currentPage);
      fetchStats();
    } catch (error) {
      toast.error('Failed to create test user and update bookings');
    }
  };

  // Initial load
  useEffect(() => {
    fetchStats();
    fetchBookings();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchBookings(currentPage);
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  // Refetch when status filter changes
  useEffect(() => {
    if (selectedStatus !== '') {
      fetchBookings(1);
      setCurrentPage(1);
    }
  }, [selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-primary text-primary-foreground';
      case 'expired': return 'bg-destructive text-destructive-foreground';
      case 'completed': return 'bg-accent text-accent-foreground';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      case 'refunded': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    return minutes > 0 ? `${minutes}m` : 'Expired';
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency
    }).format(amount / 100); // Razorpay amounts are in paise
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seat Booking Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Verification Summary */}
      <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg text-primary">Payment Verification Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats?.paymentVerified || 0}</div>
              <div className="text-sm text-primary/80">Payment Verified</div>
              <div className="text-xs text-primary/60">Seats confirmed after payment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingPayment || 0}</div>
              <div className="text-sm text-yellow-700">Pending Payment</div>
              <div className="text-xs text-yellow-600">Awaiting payment confirmation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{stats?.temporaryReservations || 0}</div>
              <div className="text-sm text-accent/80">Temporary Reservations</div>
              <div className="text-xs text-accent/60">5-minute holds during payment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.active || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.expired || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats?.completed || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payment Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.paymentVerified || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cash Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.cashBookings || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.recent24h || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <div className="flex gap-2 items-center">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="completed">Completed</option>
              <option value="payment-verified">Payment Verified</option>
              <option value="pending-payment">Pending Payment</option>
              <option value="cash-bookings">Cash Bookings</option>
              <option value="temporary">Temporary</option>
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={createTestUserAndUpdate}
              className="text-xs"
            >
              Create Test User & Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={updateUserInfo}
              className="text-xs"
            >
              Update User Names
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Seat</th>
                  <th className="text-left p-2">Order ID</th>
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Payment</th>
                  <th className="text-left p-2">Booked At</th>
                  <th className="text-left p-2">Expires</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                ) : (
                  bookings.map((booking) => {
                    console.log('Rendering booking:', booking);
                    return (
                      <tr key={booking._id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">
                          <div className="flex items-center gap-2">
                            <span>Seat {booking.seatNumber}</span>
                            {booking.isTemporary && (
                              <Badge variant="outline" className="text-xs">TEMP</Badge>
                            )}
                            {booking.paymentVerified && (
                              <Badge variant="default" className="text-xs bg-primary">PAID</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          <div className="space-y-1">
                            <div className="font-mono text-xs">{booking.orderId}</div>
                            {booking.razorpayOrderId && (
                              <div className="text-xs text-gray-500">
                                Razorpay: {booking.razorpayOrderId.slice(-8)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          <div className="space-y-1">
                            <div className="font-medium">
                              {booking.userName && booking.userName !== 'Guest User' 
                                ? booking.userName 
                                : (booking.userId ? 'Loading...' : 'Guest User')
                              }
                            </div>
                            {booking.userId && (
                              <div className="text-xs text-gray-500">{booking.userId}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <Badge className={`${getStatusColor(booking.status)} text-white`}>
                            {booking.status}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <div className="space-y-1">
                            <Badge 
                              className={`${getPaymentStatusColor(booking.paymentStatus || 'pending')} text-white text-xs`}
                            >
                              {booking.paymentStatus || 'pending'}
                            </Badge>
                            {booking.paymentVerified && (
                              <Badge variant="outline" className="text-xs text-primary">
                                ✓ Verified
                              </Badge>
                            )}
                            {booking.paymentAmount && (
                              <div className="text-xs text-gray-600">
                                {formatCurrency(booking.paymentAmount, booking.paymentCurrency)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-sm">{formatTime(booking.bookedAt)}</td>
                        <td className="p-2 text-sm">
                          {booking.status === 'active' ? getTimeRemaining(booking.expiresAt) : formatTime(booking.expiresAt)}
                        </td>
                        <td className="p-2">
                          {booking.status === 'active' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => expireBookings(booking.orderId)}
                            >
                              Expire
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchBookings(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchBookings(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
