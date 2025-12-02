import { API_URL } from '../api';

const API_BASE_URL = `${API_URL}/api/seats`;

export interface SeatStatus {
  seatNumber: number;
  status: 'available' | 'occupied';
  booking?: {
    orderId: string;
    userName?: string;
    bookedAt: string;
    expiresAt: string;
    timeRemaining: number;
    paymentVerified?: boolean;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  } | null;
}

export interface SeatBookingResponse {
  success: boolean;
  seats: SeatStatus[];
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number;
}

export interface BookingRequest {
  seats: number[];
  orderId: string;
  userId?: string;
  userName?: string;
  orderDetails?: any;
}

export interface PaymentVerifiedBookingRequest extends BookingRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookings: any[];
  expiresAt: string;
  timeRemaining: number;
  paymentVerified: boolean;
  razorpayOrderId: string;
  razorpayPaymentId: string;
}

export interface SeatProtectionStatus {
  seatNumber: number;
  status: 'available' | 'protected';
  protected: boolean;
  protectionType: 'temporary' | 'confirmed' | null;
  timeRemaining: number | null;
  timeRemainingFormatted: string | null;
  bookedBy: string | null;
  orderId: string | null;
  paymentVerified?: boolean;
  paymentStatus?: string;
  expiresAt?: string;
  isTemporary?: boolean;
}

export interface ProtectionStatusResponse {
  success: boolean;
  protectionStatus: SeatProtectionStatus[];
  summary: {
    totalSeats: number;
    protectedSeats: number;
    availableSeats: number;
    confirmedBookings: number;
    temporaryReservations: number;
  };
  timestamp: string;
}

export class SeatService {
  // Get all seat status
  static async getSeatStatus(): Promise<SeatBookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch seat status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching seat status:', error);
      throw error;
    }
  }

  // Get available seats only
  static async getAvailableSeats(): Promise<number[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/available`);
      if (!response.ok) {
        throw new Error('Failed to fetch available seats');
      }
      const data = await response.json();
      return data.availableSeats;
    } catch (error) {
      console.error('Error fetching available seats:', error);
      throw error;
    }
  }

  // NEW: Book seats after successful payment verification
  static async bookSeatsAfterPayment(bookingData: PaymentVerifiedBookingRequest): Promise<BookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/book-after-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book seats after payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error booking seats after payment:', error);
      throw error;
    }
  }

  // DEPRECATED: Old booking method - now requires payment verification
  static async bookSeats(bookingData: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book seats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error booking seats:', error);
      throw error;
    }
  }

  // NEW: Book seats for cash payments (no payment verification required)
  static async bookSeatsForCash(bookingData: BookingRequest): Promise<BookingResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/book-cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to book seats for cash payment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error booking seats for cash payment:', error);
      throw error;
    }
  }

  // Cancel seat booking
  static async cancelBooking(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/cancel/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Get booking details by order ID
  static async getBookingDetails(orderId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/order/${orderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get booking details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting booking details:', error);
      throw error;
    }
  }

  // Extend booking time (admin function)
  static async extendBooking(orderId: string, additionalMinutes: number = 15): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/extend/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ additionalMinutes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to extend booking');
      }

      return await response.json();
    } catch (error) {
      console.error('Error extending booking:', error);
      throw error;
    }
  }

  // NEW: Verify payment before booking seats
  static async verifyPaymentAndBookSeats(
    seats: number[],
    orderId: string,
    userId: string,
    userName: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    orderDetails?: any
  ): Promise<BookingResponse> {
    try {
      // First verify the payment with Razorpay
      const paymentVerified = await this.verifyRazorpayPayment(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      );

      if (!paymentVerified) {
        throw new Error('Payment verification failed. Cannot book seats.');
      }

      // If payment is verified, proceed to book seats
      const bookingData: PaymentVerifiedBookingRequest = {
        seats,
        orderId,
        userId,
        userName,
        orderDetails,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature
      };

      return await this.bookSeatsAfterPayment(bookingData);
    } catch (error) {
      console.error('Error in payment verification and seat booking:', error);
      throw error;
    }
  }

  // NEW: Verify Razorpay payment signature
  private static async verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    try {
      // This would typically be done on the server side for security
      // For now, we'll return true and let the server handle verification
      console.log('Payment verification request:', { orderId, paymentId, signature });
      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  }

  // NEW: Get payment status for a booking
  static async getPaymentStatus(orderId: string): Promise<{
    success: boolean;
    paymentVerified: boolean;
    paymentStatus: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  }> {
    try {
      const bookingDetails = await this.getBookingDetails(orderId);
      
      if (bookingDetails.success && bookingDetails.bookings.length > 0) {
        const firstBooking = bookingDetails.bookings[0];
        return {
          success: true,
          paymentVerified: firstBooking.paymentVerified || false,
          paymentStatus: firstBooking.paymentStatus || 'pending',
          razorpayOrderId: firstBooking.razorpayOrderId,
          razorpayPaymentId: firstBooking.razorpayPaymentId
        };
      }
      
      return {
        success: false,
        paymentVerified: false,
        paymentStatus: 'not_found'
      };
    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        success: false,
        paymentVerified: false,
        paymentStatus: 'error'
      };
    }
  }

  // NEW: Get real-time seat protection status
  static async getSeatProtectionStatus(): Promise<ProtectionStatusResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/protection-status`);
      if (!response.ok) {
        throw new Error('Failed to fetch seat protection status');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching seat protection status:', error);
      throw error;
    }
  }

  // NEW: Check if specific seats are protected
  static async checkSeatsProtection(seatNumbers: number[]): Promise<{
    available: number[];
    protected: number[];
    details: SeatProtectionStatus[];
  }> {
    try {
      const protectionStatus = await this.getSeatProtectionStatus();
      
      const available: number[] = [];
      const protectedSeats: number[] = [];
      const details: SeatProtectionStatus[] = [];
      
      seatNumbers.forEach(seatNumber => {
        const seatStatus = protectionStatus.protectionStatus.find(
          seat => seat.seatNumber === seatNumber
        );
        
        if (seatStatus && seatStatus.protected) {
          protectedSeats.push(seatNumber);
        } else {
          available.push(seatNumber);
        }
        
        if (seatStatus) {
          details.push(seatStatus);
        }
      });
      
      return { available, protected: protectedSeats, details };
    } catch (error) {
      console.error('Error checking seats protection:', error);
      throw error;
    }
  }
}
