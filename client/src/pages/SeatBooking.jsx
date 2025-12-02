/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FeedbackService } from "@/services/feedbackService";
import { SeatService } from "@/services/seatService";
import { CartService, Cart, CartItem } from "@/services/cartService";
import { IndianRupee, ReceiptIndianRupeeIcon } from "lucide-react";

const SeatBooking = () => {
    return (
        <>
            <CardFooter className="flex flex-col gap-4">
                <Button
                    className="w-full bg-quicktap-navy hover:bg-quicktap-navy/90 text-white"
                    onClick={handleCheckout}
                    disabled={cart.length === 0}
                >
                    Pay Now (₹{getTotalPrice()})
                </Button>

                {/* Optional Seat Booking Section */}
                <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold mb-3 text-sm"> Book Your Seats</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                        Choose from available seats.
                    </p>

                    {/* ENHANCED: Blocked Seats Warning */}
                    {Object.values(seatStatus).some(status => status === 'blocked') && (
                        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <div className="flex items-center gap-2 text-red-700">
                                <span>⚠️</span>
                                <span>
                                    Some seats are currently blocked and cannot be selected.
                                    They will become available after their 30-minute booking period expires.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Seat Selection Grid */}
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded bg-white">
                        {loadingSeats ? (
                            <div className="w-full text-center py-4 text-xs text-muted-foreground">
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-quicktap-teal border-t-transparent rounded-full animate-spin"></div>
                                    Loading seat availability...
                                </div>
                            </div>
                        ) : (
                            Array.from({ length: 15 }, (_, i) => i + 1).map(seatNumber => {
                                const seatStatusValue = seatStatus[seatNumber];
                                const isOccupied = seatStatusValue === 'occupied';
                                const isBlocked = seatStatusValue === 'blocked';
                                const isSelected = selectedSeats.includes(seatNumber);

                                // ENHANCED: Get seat details for better blocking logic
                                const seatDetail = seatDetails[seatNumber];
                                const timeRemaining = seatDetail?.booking?.timeRemaining || 0;

                                return (
                                    <button
                                        key={seatNumber}
                                        className={`px-2 py-1 rounded border text-xs transition-all relative ${isSelected
                                            ? "bg-quicktap-teal text-white border-quicktap-teal"
                                            : isBlocked || isOccupied
                                                ? "bg-red-100 text-red-600 border-red-300 cursor-not-allowed opacity-60"
                                                : "bg-white hover:bg-gray-100 border-gray-300"
                                            }`}
                                        onClick={() => {
                                            // ENHANCED: Prevent clicking on blocked or occupied seats
                                            if (isBlocked || isOccupied) {
                                                if (timeRemaining > 0) {
                                                    toast.info(`Seat ${seatNumber} is blocked for ${timeRemaining} more minutes`);
                                                } else {
                                                    toast.info(`Seat ${seatNumber} is occupied`);
                                                }
                                                return;
                                            }

                                            if (isSelected) {
                                                handleSeatDeselect(seatNumber);
                                            } else {
                                                handleSeatSelect(seatNumber);
                                            }
                                        }}
                                        disabled={isBlocked || isOccupied}
                                        type="button"
                                        title={
                                            isBlocked
                                                ? `Seat ${seatNumber} - BLOCKED\nExpires in ${timeRemaining} minutes\n\nThis seat cannot be selected for ${timeRemaining} more minutes.`
                                                : isOccupied
                                                    ? `Seat ${seatNumber} is occupied`
                                                    : `Seat ${seatNumber} - Available`
                                        }
                                    >
                                        {seatNumber}
                                        {/* ENHANCED: Show time remaining overlay for blocked seats */}
                                        {isBlocked && timeRemaining > 0 && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                {timeRemaining > 99 ? '∞' : timeRemaining}
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Selected Seats Display */}
                    {selectedSeats.length > 0 && (
                        <div className="mt-3 p-2 bg-quicktap-teal/10 border border-quicktap-teal/20 rounded">
                            <p className="text-xs font-medium text-quicktap-teal">
                                Selected Seats: {selectedSeats.join(', ')}
                            </p>
                        </div>
                    )}

                    {/* Seat Legend */}
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                                <span>Available</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-quicktap-teal rounded"></div>
                                <span>Selected</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded opacity-60"></div>
                                <span>Blocked/Occupied</span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchSeatAvailability}
                            disabled={loadingSeats}
                            className="text-xs h-6 px-2"
                        >
                            {loadingSeats ? "Refreshing..." : "Refresh"}
                        </Button>
                    </div>

                    {/* Seat Booking Info */}
                    {/* <div className="mt-2 text-xs text-muted-foreground">
                        <p>• Seats are optional - you can order without booking</p>
                        <p>• Seats are reserved for 30 minutes after booking</p>
                        <p>• You can select multiple seats if needed</p>
                        <p>• Blocked seats will be available after 30 minutes</p>
                        <p>• Red seats with timers are currently blocked</p>
                      </div> */}
                </div>

            </CardFooter><div>SeatBooking</div></>
    )
}

export default SeatBooking