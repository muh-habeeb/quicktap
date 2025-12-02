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
import { API_URL } from "@/api";

interface Food {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  preparationTime: number;
  ingredients: string[];
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface LocalCartItem extends Food {
  quantity: number;
}

// Food item component
function FoodItem({ item, onAddToCart, cartLoading }: { item: Food; onAddToCart: (item: Food) => void; cartLoading: boolean }) {
  return (
    <Card className="overflow-hidden bg-creamy/5 border border-quicktap-creamy/90 hover:shadow-2xl transition-shadow duration-200 rounded-2xl">
      <div className="aspect-video w-full overflow-hidden">
        <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-quicktap-creamy">{item.name}</CardTitle>
          <Badge variant="outline" className="border-quicktap-creamy text-quicktap-creamy">
            {item.category}
          </Badge>
        </div>
        <CardDescription className="text-base text-quicktap-creamy/60">{item.description}</CardDescription>
      </CardHeader>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <span className="font-bold text-emerald-500 text-2xl">₹{item.price}</span>
        <Button
          onClick={() => onAddToCart(item)}
          size="sm"
          className="bg-quicktap-teal hover:bg-quicktap-teal/90 text-white"
          disabled={!item.isAvailable || cartLoading}
        >
          {item.isAvailable ? (cartLoading ? 'Adding...' : 'Add to Cart') : 'Not Available'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Enhanced user preferences with ordering history
const userPreferences = {
  priceRange: { min: 0, max: 1000 },
  preferredVendors: ["all"],
  dietType: "both" as "veg" | "non-veg" | "both",
  previousOrders: [] as string[],
  // NEW: Enhanced ordering patterns
  orderFrequency: {} as Record<string, number>, // How often each food is ordered
  orderTiming: {} as Record<string, number[]>, // When each food is typically ordered
  orderSequences: [] as string[][], // Order sequences (what was ordered together)
  lastOrdered: {} as Record<string, Date>, // When each food was last ordered
  seasonalPreferences: {} as Record<string, number>, // Seasonal food preferences
};

// NEW: Predictive recommendation algorithm based on user behavior and actual order data
async function generatePredictiveRecommendations(allFoodItems: Food[], cart: CartItem[], userId: string) {
  let recommendations: (Food & { reason: string[]; totalScore: number })[] = [];

  try {
    // Fetch user's actual orders from backend
    const userOrders = await fetchUserOrders(userId);
    console.log('📊 User orders fetched:', userOrders);

    // If new user (no order history) AND empty cart, don't show recommendations
    if ((!userOrders || userOrders.length === 0) && (!cart || cart.length === 0)) {
      console.log('👤 New user with empty cart - no recommendations');
      return [];
    }

    // If no orders but has cart items, show items from cart's categories
    if (!userOrders || userOrders.length === 0) {
      console.log('👤 New user but has cart items, showing similar items');
      const cartCategories = cart.map(item => item.category);
      const categoryItems = allFoodItems.filter(item => 
        cartCategories.includes(item.category) && !cart.some(cartItem => cartItem._id === item._id)
      );
      return categoryItems.slice(0, 4).map((item, idx) => ({
        ...item,
        reason: ['Similar to items in your cart'],
        totalScore: 0,
        _sortKey: idx
      }));
    }

    // Analyze user's order history
    const orderAnalysis = analyzeUserOrderData(userOrders, allFoodItems);
    console.log('📈 Order analysis:', orderAnalysis);

    // Score each food item based on analysis
    allFoodItems.forEach(item => {
      let totalScore = 0;
      const reasons: string[] = [];

      // Skip items already in cart
      if (cart.some(cartItem => cartItem._id === item._id)) {
        return;
      }

      // 1. HIGHEST PRIORITY: ORDER FREQUENCY & SPENDING ANALYSIS
      const frequencyData = orderAnalysis.itemFrequency[item._id];
      if (frequencyData) {
        totalScore += frequencyData.frequency * 50; // Weight: 50 points per order
        totalScore += frequencyData.totalSpent / 10; // Weight: 0.1 point per rupee spent
        reasons.push(`You've ordered this ${frequencyData.frequency}x (₹${frequencyData.totalSpent} spent)`);
      }

      // 2. CATEGORY PREFERENCE
      const categoryScore = orderAnalysis.categoryPreferences[item.category] || 0;
      if (categoryScore > 0) {
        totalScore += categoryScore * 15; // Weight: 15 points per category order
        reasons.push(`You prefer ${item.category} items`);
      }

      // 3. TIMING PATTERN (Optional - if available)
      if (orderAnalysis.orderingTimes && orderAnalysis.orderingTimes.length > 0) {
        const currentHour = new Date().getHours();
        const avgOrderTime = orderAnalysis.orderingTimes.reduce((a: number, b: number) => a + b, 0) / orderAnalysis.orderingTimes.length;
        const timeDiff = Math.abs(currentHour - avgOrderTime);
        
        if (timeDiff <= 2) {
          totalScore += 20;
          reasons.push(`Often ordered around this time`);
        }
      }

      // 4. PRICE PATTERN
      if (orderAnalysis.avgPrice > 0) {
        const priceRatio = item.price / orderAnalysis.avgPrice;
        if (priceRatio >= 0.7 && priceRatio <= 1.3) {
          totalScore += 15;
          reasons.push(`Matches your usual price range`);
        }
      }

      // 5. ITEMS ORDERED TOGETHER
      if (orderAnalysis.itemsTogether[item._id]) {
        const cartMatch = cart.filter(cartItem => 
          orderAnalysis.itemsTogether[item._id].includes(cartItem._id)
        ).length;
        if (cartMatch > 0) {
          totalScore += cartMatch * 25;
          reasons.push(`Often ordered with items in your cart`);
        }
      }

      // 6. AVAILABILITY BOOST
      if (item.isAvailable) {
        totalScore += 5;
        reasons.push('Currently available');
      }

      // Only add items with scores or reasons
      if (totalScore > 0 || reasons.length > 0) {
        recommendations.push({
          ...item,
          reason: reasons.slice(0, 2),
          totalScore
        });
      }
    });

    // Sort by total score (highest first)
    recommendations.sort((a, b) => b.totalScore - a.totalScore);

    console.log('🎯 Top recommendations:', recommendations.slice(0, 4).map(r => ({
      name: r.name,
      score: r.totalScore,
      reasons: r.reason
    })));

    // Return top 4 recommendations
    return recommendations.slice(0, 4).map((item, idx) => ({
      ...item,
      _sortKey: idx
    }));

  } catch (error) {
    console.error('❌ Error in recommendations:', error);
    // Fallback to popular items
    return allFoodItems.slice(0, 4).map((item, idx) => ({
      ...item,
      reason: ['Popular item'],
      totalScore: 0,
      _sortKey: idx
    }));
  }
}

// Fetch user's orders from backend
async function fetchUserOrders(userId: string) {
  try {
    const response = await fetch(`${API_URL}/api/orders/user/${userId}`);
    if (!response.ok) {
      console.log('ℹ️ No orders found for user (first time)');
      return [];
    }
    const data = await response.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

// Analyze user's order data to extract patterns
function analyzeUserOrderData(orders: any[], allFoodItems: Food[]) {
  const analysis = {
    itemFrequency: {} as Record<string, { frequency: number; totalSpent: number }>,
    categoryPreferences: {} as Record<string, number>,
    orderingTimes: [] as number[],
    avgPrice: 0,
    itemsTogether: {} as Record<string, string[]>
  };

  if (!orders || orders.length === 0) {
    return analysis;
  }

  let totalAmount = 0;

  orders.forEach((order: any) => {
    if (!order.items || order.items.length === 0) return;

    // Record order time (hour)
    try {
      const orderHour = new Date(order.createdAt).getHours();
      analysis.orderingTimes.push(orderHour);
    } catch (e) {
      // ignore
    }

    // Analyze each item in the order
    order.items.forEach((orderItem: any) => {
      const itemId = orderItem.foodId || orderItem._id;
      const itemPrice = orderItem.price || 0;
      const quantity = orderItem.quantity || 1;

      // Track frequency and spending
      if (!analysis.itemFrequency[itemId]) {
        analysis.itemFrequency[itemId] = { frequency: 0, totalSpent: 0 };
      }
      analysis.itemFrequency[itemId].frequency += quantity;
      analysis.itemFrequency[itemId].totalSpent += itemPrice * quantity;

      // Track category preference
      const category = orderItem.category || 'unknown';
      analysis.categoryPreferences[category] = (analysis.categoryPreferences[category] || 0) + quantity;

      // Track items ordered together
      const otherItemIds = order.items
        .filter((item: any) => (item.foodId || item._id) !== itemId)
        .map((item: any) => item.foodId || item._id);

      if (otherItemIds.length > 0) {
        if (!analysis.itemsTogether[itemId]) {
          analysis.itemsTogether[itemId] = [];
        }
        analysis.itemsTogether[itemId].push(...otherItemIds);
      }

      totalAmount += itemPrice * quantity;
    });
  });

  // Calculate average price per item
  const totalItems = Object.values(analysis.itemFrequency).reduce((sum: number, item: any) => sum + item.frequency, 0);
  analysis.avgPrice = totalItems > 0 ? totalAmount / totalItems : 0;

  // Remove duplicates from itemsTogether
  Object.keys(analysis.itemsTogether).forEach(key => {
    analysis.itemsTogether[key] = [...new Set(analysis.itemsTogether[key])];
  });

  return analysis;
}

export default function Food() {
  const navigate = useNavigate();

  const [cart, setCart] = useState<LocalCartItem[]>([]);
  const [dbCart, setDbCart] = useState<Cart | null>(null);
  const [activeDay, setActiveDay] = useState("monday");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [currentOrderId, setCurrentOrderId] = useState<string>("");
  const [seatBookingLoading, setSeatBookingLoading] = useState(false);
  const [seatStatus, setSeatStatus] = useState<{ [key: number]: 'available' | 'occupied' | 'blocked' }>({});
  const [seatDetails, setSeatDetails] = useState<{ [key: number]: any }>({});
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  // Orders: keep track of user's orders for this session and show popup
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [showOrderPopup, setShowOrderPopup] = useState(false);
  const [lastOrder, setLastOrder] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<(Food & { reason: string[]; _sortKey: number })[]>([]);

  // Note: Authentication is handled by PrivateRoute in App.tsx
  // This component will only render if user is logged in


  // Get user ID from localStorage
  const getUserId = () => {
    const userInfo = localStorage.getItem('user-info');
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        return user.email || 'guest';
      } catch (error) {
        return 'guest';
      }
    }
    return 'guest';
  };

  // Load persisted orders from localStorage so they remain across reloads
  const loadStoredOrders = () => {
    try {
      const uid = getUserId();
      const key = `user-orders-${uid}`;
      const existing = localStorage.getItem(key);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed.orders)) {
          setOrdersList(parsed.orders);
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // On mount, and whenever user changes (e.g., login), load orders
  useEffect(() => {
    loadStoredOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Record order locally and open confirmation popup
  const recordOrder = (order: any) => {
    try {
      setOrdersList((prev) => {
        const exists = prev.some((o) => (o?._id || o?.id) === (order?._id || order?.id));
        if (exists) return prev;
        return [order, ...prev];
      });
      setLastOrder(order);
      setShowOrderPopup(true);
      // Also persist a lightweight history in localStorage per user
      const uid = getUserId();
      const key = `user-orders-${uid}`;
      const existing = localStorage.getItem(key);
      const existingOrders = existing ? JSON.parse(existing).orders : [];
      const existsInStorage = existingOrders.some((o: any) => (o?._id || o?.id) === (order?._id || order?.id));
      const payload = {
        orders: existsInStorage
          ? existingOrders
          : [
            {
              _id: order._id || order.id || `local_${Date.now()}`,
              createdAt: order.createdAt || new Date().toISOString(),
              items: order.items || [],
              totalAmount: order.totalAmount || 0,
              userName: order.userName,
            },
            ...existingOrders,
          ],
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      // Non-blocking
    }
  };

  // Fetch foods from the API
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await fetch(`${API_URL}/api/foods`);
        if (!response.ok) throw new Error('Failed to fetch foods');
        const data = await response.json();
        setFoods(data);
      } catch (error) {
        toast.error('Failed to load food items');
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // Fetch cart from database
  useEffect(() => {
    const fetchCart = async () => {
      const userId = getUserId();
      try {
        const cartData = await CartService.getCart(userId);
        setDbCart(cartData);
        // Sync with local cart
        const localCartItems: LocalCartItem[] = cartData.items.map(item => ({
          _id: item.foodId,
          name: item.name,
          description: '',
          price: item.price,
          category: item.category || '',
          image: item.image || '',
          isAvailable: true,
          preparationTime: 0,
          ingredients: [],
          nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          quantity: item.quantity
        }));
        setCart(localCartItems);
      } catch (error) {
        console.error('Error fetching cart:', error);
      }
    };
    fetchCart();
  }, []);

  // Load recommendations when foods or cart changes
  useEffect(() => {
    const loadRecommendations = async () => {
      if (foods.length === 0) return;
      
      const userId = getUserId();
      try {
        const recs = await generatePredictiveRecommendations(foods, cart as any, userId);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error loading recommendations:', error);
        setRecommendations([]);
      }
    };
    
    loadRecommendations();
  }, [foods, cart]);

  // Fetch seat availability
  const fetchSeatAvailability = async () => {
    setLoadingSeats(true);
    try {
      const response = await SeatService.getSeatStatus();
      if (response.success) {
        const statusMap: { [key: number]: 'available' | 'occupied' | 'blocked' } = {};
        const detailsMap: { [key: number]: any } = {};

        response.seats.forEach((seat: any) => {
          // Block if seat.status is occupied OR there is any booking info present with time remaining
          const isBlocked = seat.status === 'occupied' || (seat.booking && seat.booking.expiresAt && new Date(seat.booking.expiresAt) > new Date());

          if (isBlocked) {
            statusMap[seat.seatNumber] = 'blocked';
          } else {
            statusMap[seat.seatNumber] = 'available';
          }

          // Store details for tooltips and time remaining
          detailsMap[seat.seatNumber] = seat;
        });

        setSeatStatus(statusMap);
        setSeatDetails(detailsMap);
      }
    } catch (error) {
      console.error('Error fetching seat availability:', error);
    } finally {
      setLoadingSeats(false);
    }
  };

  // Fetch seat availability on component mount and periodically
  useEffect(() => {
    fetchSeatAvailability();

    // Refresh seat availability every 15 seconds for better real-time blocking
    const interval = setInterval(fetchSeatAvailability, 15000);

    return () => clearInterval(interval);
  }, []);

  // Handle adding items to cart
  const addToCart = async (item: Food) => {
    setCartLoading(true);
    try {
      const userId = getUserId();

      // Add to database cart
      const updatedCart = await CartService.addToCart(userId, {
        foodId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        category: item.category
      });

      // Update local state
      setDbCart(updatedCart);
      const localCartItems: LocalCartItem[] = updatedCart.items.map(cartItem => ({
        _id: cartItem.foodId,
        name: cartItem.name,
        description: '',
        price: cartItem.price,
        category: cartItem.category || '',
        image: cartItem.image || '',
        isAvailable: true,
        preparationTime: 0,
        ingredients: [],
        nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        quantity: cartItem.quantity
      }));
      setCart(localCartItems);

      toast.success(`Added ${item.name} to cart`);
    } catch (error) {
      toast.error('Failed to add item to cart');
      console.error('Error adding to cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  // Handle removing items from cart
  const removeFromCart = async (itemId: string) => {
    try {
      const userId = getUserId();

      // Remove from database cart
      const updatedCart = await CartService.removeFromCart(userId, itemId);

      // Update local state
      setDbCart(updatedCart);
      const localCartItems: LocalCartItem[] = updatedCart.items.map(cartItem => ({
        _id: cartItem.foodId,
        name: cartItem.name,
        description: '',
        price: cartItem.price,
        category: cartItem.category || '',
        image: cartItem.image || '',
        isAvailable: true,
        preparationTime: 0,
        ingredients: [],
        nutritionalInfo: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        quantity: cartItem.quantity
      }));
      setCart(localCartItems);

      toast.info("Item removed from cart");
    } catch (error) {
      toast.error('Failed to remove item from cart');
      console.error('Error removing from cart:', error);
    }
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Handle checkout process
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setShowPaymentOptions(true);
  };

  // Handle Razorpay payment
  const handleRazorpayPayment = async () => {
    try {
      const userId = getUserId();
      const amount = getTotalPrice();
      console.log(userId,amount)
      // Get user information from localStorage
      const userInfo = localStorage.getItem('user-info');
      let userName = "Guest User";

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          userName = user.name || "Guest User";
        } catch (parseError) {
          console.error('Error parsing user info:', parseError);
        }
      }

      // Create Razorpay order
      const response = await fetch(`${API_URL}/api/payments/create-cart-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          cartItems: dbCart ? dbCart.items : cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: amount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const data = await response.json();

      // Ensure we have an order id available for subsequent seat booking
      if (data?.order?.id) {
        setCurrentOrderId(data.order.id);
      }

      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: 'Quick Tap',
        description: 'Food Order Payment',
        order_id: data.order.id,
        handler: async function (response: any) {
          try {
            // Verify payment with user information and order details
            const verifyResponse = await fetch(`${API_URL}/api/payments/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userId,
                userName: userName,
                amount: amount,
                orderDetails: {
                  items: dbCart ? dbCart.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                  })) : cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                  })),
                  totalAmount: amount
                }
              }),
            });
            console.log(verifyResponse)

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              if (verifyData.success) {
                toast.success('Payment successful! Payment details stored in database.');

                // Create order in database for Razorpay payment
                try {
                  const created = await createOrderInDatabase('razorpay', 'completed', data.order.id, response.razorpay_payment_id);
                  toast.success('Order created successfully in database!');
                  if (created) recordOrder(created);
                } catch (orderError) {
                  console.error('Error creating order in database:', orderError);
                }

                // Complete order with seat booking (skip order creation to avoid duplicates)
                if (selectedSeats.length > 0) {
                  // For Razorpay payments, use the payment-verified seat booking endpoint
                  try {
                    const bookingData = {
                      seats: selectedSeats,
                      orderId: data.order.id, // Use Razorpay order ID
                      userId: userId,
                      userName: userName,
                      orderDetails: {
                        items: dbCart ? dbCart.items.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price
                        })) : cart.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price
                        })),
                        totalAmount: amount
                      },
                      razorpayOrderId: data.order.id,
                      razorpayPaymentId: response.razorpay_payment_id,
                      razorpaySignature: response.razorpay_signature
                    };

                    console.log('Booking seats after Razorpay payment:', bookingData);

                    // Use the payment-verified seat booking endpoint
                    const seatResponse = await fetch(`${API_URL}/api/seats/book-after-payment`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(bookingData),
                    });

                    if (seatResponse.ok) {
                      const seatData = await seatResponse.json();
                      toast.success(`Seats ${selectedSeats.join(', ')} booked successfully for 30 minutes!`);
                      console.log('Seats booked after payment:', seatData);
                    } else {
                      const seatError = await seatResponse.json();
                      console.error('Seat booking error:', seatError);
                      toast.error('Payment successful but seat booking failed. Please contact support.');
                    }
                  } catch (seatError) {
                    console.error('Error booking seats after payment:', seatError);
                    toast.error('Payment successful but seat booking failed. Please contact support.');
                  }
                }

                // Complete order without calling handleCompleteOrder to avoid duplicate seat booking
                toast.success("Order completed successfully!");

                // Clear database cart
                const clearUserId = getUserId();
                try {
                  await CartService.clearCart(clearUserId);
                  setDbCart(null);
                } catch (error) {
                  console.error('Error clearing cart:', error);
                }

                setCart([]);
                setSelectedSeats([]);
                setCurrentOrderId("");

                // Refresh seat availability after booking
                await fetchSeatAvailability();
              } else {
                toast.error('Payment verification failed');
              }
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed');
            console.error('Payment verification error:', error);
          }
        },
        prefill: {
          name: userName,
          email: userId !== 'guest' ? userId : '',
        },
        theme: {
          color: '#10B981',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error) {
      toast.error('Failed to initiate payment');
      console.error('Payment error:', error);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = async (method: string) => {
    setSelectedPaymentMethod(method);
    setShowPaymentOptions(false);

    if (method === 'cash') {
      // For cash on delivery, generate order ID and complete order with seat booking
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setCurrentOrderId(orderId);
      handleCompleteOrder();
    } else if (method === 'razorpay') {
      // For Razorpay, create order and initiate payment
      await handleRazorpayPayment();
    } else {
      // For other payment methods, proceed directly to order completion
      handleCompleteOrder();
    }
  };

  // Function to create order in database
  const createOrderInDatabase = async (paymentMethod: string, paymentStatus: string = 'pending', razorpayOrderId?: string, razorpayPaymentId?: string) => {
    try {
      const userId = getUserId();
      const userInfo = localStorage.getItem('user-info');
      let userName = "Guest User";

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          userName = user.name || "Guest User";
        } catch (parseError) {
          console.error('Error parsing user info:', parseError);
        }
      }

      const orderData = {
        userId,
        userName,
        items: dbCart ? dbCart.items.map(item => ({
          foodId: item.foodId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category
        })) : cart.map(item => ({
          foodId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          category: item.category
        })),
        totalAmount: getTotalPrice(),
        paymentMethod,
        paymentStatus,
        razorpayOrderId,
        razorpayPaymentId,
        selectedSeats: selectedSeats.length > 0 ? selectedSeats : [],
        orderNotes: selectedSeats.length > 0 ? `Seats booked: ${selectedSeats.join(', ')}` : undefined
      };

      const response = await fetch(`${API_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order in database');
      }

      const orderResult = await response.json();
      console.log('Order created in database:', orderResult);
      return orderResult.order;
    } catch (error) {
      console.error('Error creating order in database:', error);
      toast.error('Failed to create order in database');
      throw error;
    }
  };

  // Handle order completion
  const handleCompleteOrder = async (skipOrderCreation: boolean = false) => {
    if (selectedSeats.length > 0) {
      // If seats are selected, book them
      if (!currentOrderId) {
        // For cash payments, generate order ID first
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentOrderId(orderId);
        console.log('Generated order ID for cash payment:', orderId);
      }

      // Now book the seats
      await handleBookSeats();
    } else {
      // Complete order without seat booking
      try {
        // Create order in database for cash on delivery
        if (!skipOrderCreation) {
          const created = await createOrderInDatabase('cash', 'completed');
          if (created) recordOrder(created);
        }
        toast.success("Order placed successfully and stored in database!");

        // Clear database cart
        const clearUserId = getUserId();
        try {
          await CartService.clearCart(clearUserId);
          setDbCart(null);
        } catch (error) {
          console.error('Error clearing cart:', error);
        }

        setCart([]);
        setSelectedSeats([]);
        setCurrentOrderId("");
      } catch (error) {
        console.error('Error completing order:', error);
      }
    }
  };



  // Handle UPI payment
  const handleUPIPayment = () => {
    const amount = getTotalPrice();
    const upiUrl = `upi://pay?pa=yendine@upi&pn=Yendine%20Food&am=${amount}&cu=INR&tn=Food%20Order`;

    // Try to open UPI app, fallback to showing QR code
    window.open(upiUrl, '_blank');
    toast.success("Opening UPI payment app...");
  };

  // Generate QR code for UPI payment
  const generateUPIQRCode = () => {
    const amount = getTotalPrice();
    const upiString = `upi://pay?pa=yendine@upi&pn=Yendine%20Food&am=${amount}&cu=INR&tn=Food%20Order`;
    return upiString;
  };

  // Handle seat selection
  const handleSeatSelect = (seatNumber: number) => {
    setSelectedSeats(prev => [...prev, seatNumber]);
  };

  // Handle seat deselection
  const handleSeatDeselect = (seatNumber: number) => {
    setSelectedSeats(prev => prev.filter(seat => seat !== seatNumber));
  };

  // Function to handle seat booking submission
  const handleBookSeats = async () => {
    console.log('🚀 handleBookSeats called with:', {
      selectedSeats,
      currentOrderId,
      selectedPaymentMethod
    });

    if (selectedSeats.length === 0) {
      console.log('No seats selected, skipping seat booking');
      return; // No seats selected, just complete the order
    }

    if (!currentOrderId) {
      console.error('❌ Missing currentOrderId:', currentOrderId);
      toast.error('Order could not be identified. Please try placing the order again.');
      throw new Error('Missing order id for seat booking');
    }

    console.log('✅ Starting seat booking process...', { selectedSeats, currentOrderId });
    setSeatBookingLoading(true);

    try {
      // Get user information from localStorage
      const userInfo = localStorage.getItem('user-info');
      let userName = "Guest User";
      let userId = null;

      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          userName = user.name || "Guest User";
          userId = user.email; // Using email as userId for now
        } catch (parseError) {
          console.error('Error parsing user info:', parseError);
        }
      }

      console.log('👤 User info:', { userName, userId });

      const bookingData = {
        seats: selectedSeats,
        orderId: currentOrderId,
        userId: userId,
        userName: userName,
        orderDetails: {
          items: dbCart ? dbCart.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })) : cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: getTotalPrice()
        }
      };

      console.log('📝 Sending booking data to server:', bookingData);

      const response = await SeatService.bookSeatsForCash(bookingData);
      console.log('✅ Seat booking response:', response);

      // Create order in database after successful seat booking
      try {
        const created = await createOrderInDatabase('cash', 'completed');
        if (created) recordOrder(created);
        toast.success(`Seats ${selectedSeats.join(', ')} booked successfully for 30 minutes! Order stored in database.`);
      } catch (orderError) {
        console.error('Error creating order in database:', orderError);
        toast.success(`Seats ${selectedSeats.join(', ')} booked successfully for 30 minutes!`);
      }

      // Clear database cart
      const clearCartUserId = getUserId();
      try {
        await CartService.clearCart(clearCartUserId);
        setDbCart(null);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }

      setCart([]);
      setSelectedSeats([]);
      setCurrentOrderId("");

      // Refresh seat availability after booking
      await fetchSeatAvailability();
    } catch (error: any) {
      console.error('❌ Seat booking error:', error);
      toast.error(error.message || "Failed to book seats.");
    } finally {
      setSeatBookingLoading(false);
    }
  };

  // Group foods by category for display
  const foodsByCategory = foods.reduce<Record<string, Food[]>>((acc, food) => {
    if (!acc[food.category]) {
      acc[food.category] = [];
    }
    acc[food.category].push(food);
    return acc;
  }, {});

  // Only show recommendations if user has orders or cart items
  const fallbackRecommendations = recommendations.length > 0 ?
    recommendations.slice(0, 4).map((item, idx) => ({ ...item, _sortKey: idx })) :
    [];

  // Debug: Log recommendation details
  console.log('Food recommendations:', {
    totalFoods: foods.length,
    recommendationsCount: recommendations.length,
    fallbackCount: fallbackRecommendations.length,
    recommendations: fallbackRecommendations.map((r: any) => ({ name: r.name, category: r.category, reasons: r.reason })),
    cartItems: cart.length
  });

  // Handle feedback change
  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    if (feedbackRef.current) {
      feedbackRef.current.style.height = "auto";
      feedbackRef.current.style.height = feedbackRef.current.scrollHeight + "px";
    }
  };

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter your feedback.");
      return;
    }
    setSubmitting(true);
    try {
      await FeedbackService.createFeedback({ feedback: feedback.trim() });
      toast.success("Thank you for your feedback!");
      setFeedback("");
      if (feedbackRef.current) feedbackRef.current.style.height = "32px";
    } catch (error) {
      toast.error("Failed to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DefaultLayout>
      <div className="container py-8 t">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-quicktap-creamy">Order Your Food</h1>
        </div>



        {/* Food Recommendation Section - Only show if user has order history or cart items */}
        {fallbackRecommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-quicktap-creamy/60">Recommended for you</h2>

          {fallbackRecommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 place-self-center  ">
              {fallbackRecommendations.map((item: any, index) => (
                <Card key={`recommend-${item._id}-${item._sortKey}`} className=" hover:scale-105 duration-200 transition-all w-[200px] rounded-3xl flex flex-col items-center gap-3 p-3 hover:shadow-md ">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-[100px] h-[100px] object-cover rounded-[50%]"
                  />
                  <div className="text-center flex-1 capitalize">
                    <p className="font-medium text-md">{item.name}</p>
                    <p className="text-sm text-muted-foreground">₹{item.price}</p>
                    <p className="text-sm text-quicktap-teal">{item.category}</p>
                    {item.reason && item.reason.length > 0 && (
                      <span>
                        <p className="text-xs text-quicktap-darkGray/60 mt-1">.{item.reason[0]}</p>
                        <p className="text-xs text-quicktap-darkGray/60 mt-1">.{item.reason[1]}</p>
                      </span>
                    )}

                    <Button
                      size="sm"
                      onClick={() => addToCart(item)}
                      disabled={!item.isAvailable || cartLoading}
                      className="w-full bg-quicktap-green/80 hover:bg-quicktap-green text-white mt-3"
                    >
                      {cartLoading ? 'Adding...' : 'Add to Cart'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Recommendation Stats */}
          <div className="mt-4 text-center text-quicktap-lightGray/70 text-sm ">
            <p>
              Based on your order history and preferences
            </p>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Food Menu Section */}
          <div className="md:col-span-2 space-y-6">
            <Tabs defaultValue={activeDay} onValueChange={setActiveDay}>
              <TabsContent key={activeDay} value={activeDay}>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Loading food items...</p>
                  </div>
                ) : foods.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No food items available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                    {Object.entries(foodsByCategory).map(([category, items]) => (
                      <div key={category} className="col-span-2 ">
                        <h3 className="text-2xl font-semibold mb-4 capitalize text-quicktap-creamy ">{category}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
                          {items.map(item => (
                            <FoodItem  key={item._id} item={item} onAddToCart={addToCart} cartLoading={cartLoading} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          {/* Cart Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Order</CardTitle>
                <CardDescription>{cart.length} items in cart</CardDescription>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4 capitalize">
                    {cart.map(item => (
                      <div key={item._id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x ₹{item.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">₹{item.price * item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item._id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-8 w-8"
                          >
                            ✕
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between">
                        <span className="font-bold">Total:</span>
                        <span className="font-bold">₹{getTotalPrice()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <Button
                className="w-full bg-quicktap-darkGray hover:bg-quicktap-green/90 text-white hover:text-white"
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Pay Now (₹{getTotalPrice()})
              </Button>
            </Card>
          </div>
        </div>
        {/* 
        {/* Payment Options Modal */}
        {showPaymentOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Select Payment Method</h3>

              {/* Selected Seats Summary */}
              {selectedSeats.length > 0 && (
                <div className="mb-4 p-3 bg-quicktap-teal/10 border border-quicktap-teal/20 rounded">
                  <p className="text-sm font-medium text-quicktap-teal">
                    Selected Seats: {selectedSeats.join(', ')}
                  </p>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="mb-6">
                <div className="space-y-3">
                  <Button
                    className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handlePaymentMethodSelect("razorpay")}
                  >
                    <span className="mr-2"><ReceiptIndianRupeeIcon></ReceiptIndianRupeeIcon></span>
                    Pay with Razorpay
                  </Button>
                  <Button
                    className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handlePaymentMethodSelect("cash")}
                  >
                    <span className="mr-2"><IndianRupee /></span>
                    Cash on Delivery
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentOptions(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Order Confirmation Popup */}
        {showOrderPopup && lastOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-2">Order Confirmed</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Thank you, {lastOrder.userName || 'User'}! Your order has been placed successfully.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Order Time</span>
                  <span>{new Date(lastOrder.createdAt || Date.now()).toLocaleString()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Items</p>
                  <div className="text-xs text-muted-foreground grid gap-1">
                    {(lastOrder.items || []).map((it: any, i: number) => (
                      <div key={i}>{it.name} ×{it.quantity} (₹{it.price})</div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">₹{lastOrder.totalAmount}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-quicktap-teal hover:bg-quicktap-teal/90 text-white" onClick={() => setShowOrderPopup(false)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DefaultLayout>
  );
}
