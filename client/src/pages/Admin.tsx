import { useState, useEffect } from "react";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUpload } from "@/components/ui/image-upload";
import { FeedbackDisplay } from "@/components/FeedbackDisplay";
import SeatAdminDashboard from "@/components/SeatAdminDashboard";
import { checkAdminStatus } from "@/services/api";
import { Loader, Loader2, ShieldX } from "lucide-react";
import { Navigate } from "react-router-dom";

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

interface Order {
  _id: string;
  userId: string;
  userName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    category?: string;
  }>;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  selectedSeats: number[];
  createdAt: string;
  estimatedDeliveryTime: string;
}

interface Post {
  _id: string;
  author: string;
  title: string;
  content: string;
  type: string;
  status: string;
}

// Payment type
interface Payment {
  _id: string;
  userId: string;
  userName: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  orderDetails: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalAmount: number;
  };
  paymentMethod: string;
  createdAt: string;
}

// Feedback type
interface Feedback {
  _id: string;
  feedback: string;
  userName?: string;
}

export default function Admin() {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [foods, setFoods] = useState<Food[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orderStats, setOrderStats] = useState<any>(null);
  const [isAddFoodDialogOpen, setIsAddFoodDialogOpen] = useState(false);
  const [isEditFoodDialogOpen, setIsEditFoodDialogOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isEditingFood, setIsEditingFood] = useState(false);

  const [newFood, setNewFood] = useState<Partial<Food>>({
    name: '',
    description: '',
    price: 0,
    category: 'main',
    image: '',
    preparationTime: 0,
    ingredients: [],
    nutritionalInfo: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    }
  });

  // Check admin status on component mount
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const result = await checkAdminStatus();
        setIsAdmin(result.isAdmin);
      } catch (error) {
        console.error('Error verifying admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  // Fetch data on component mount (only if admin)
  useEffect(() => {
    if (isAdmin) {
      fetchFoods();
      fetchOrders();
      fetchPosts();
      fetchPayments();
      fetchOrderStats();
    }
  }, [isAdmin]);

  // Show loading state
  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-yendine-navy" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  const fetchFoods = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/foods');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch foods');
      }
      const data = await response.json();
      setFoods(data);
    } catch (error) {
      console.error('Error fetching foods:', error);
      toast.error('Failed to fetch foods');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/admin/all');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        toast.error('Failed to fetch orders');
      }
    } catch (error) {
      toast.error('Failed to fetch orders');
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      toast.error('Failed to fetch posts');
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/payments/admin/all');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/orders/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };


  const handleAddFood = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingFood(true);
    try {
      // Validate required fields
      if (!newFood.name || !newFood.description || !newFood.price || !newFood.category || !newFood.image) {
        toast.error('Please fill in all required fields including image');
        setIsAddingFood(false);
        return;
      }

      // Prepare the food data
      const foodData = {
        name: newFood.name,
        description: newFood.description,
        price: Number(newFood.price),
        category: newFood.category,
        image: newFood.image,
        isAvailable: true,
        preparationTime: Number(newFood.preparationTime) || 0,
        ingredients: newFood.ingredients || [],
        nutritionalInfo: {
          calories: newFood.nutritionalInfo?.calories || 0,
          protein: newFood.nutritionalInfo?.protein || 0,
          carbs: newFood.nutritionalInfo?.carbs || 0,
          fat: newFood.nutritionalInfo?.fat || 0
        }
      };

      console.log('Sending food data:', foodData);

      // Send request to store in database
      const response = await fetch('http://localhost:5000/api/foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(foodData),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add food item');
      }

      // Get the newly created food item from response
      const addedFood = await response.json();

      // Update the local state with the new food item
      setFoods(prevFoods => [...prevFoods, addedFood]);

      // Close the dialog and reset form
      setIsAddFoodDialogOpen(false);
      setNewFood({
        name: '',
        description: '',
        price: 0,
        category: 'meals',
        image: '',
        preparationTime: 0,
        ingredients: [],
        nutritionalInfo: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0
        }
      });

      // Show success message
      toast.success('Food item added successfully to database');

      // Refresh the food list to ensure we have the latest data
      fetchFoods();
    } catch (error) {
      console.error('Error adding food:', error);
      toast.error(error.message || 'Failed to add food item to database');
    } finally {
      setIsAddingFood(false);
    }
  };

  const handleUpdateFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood) return;

    setIsEditingFood(true);
    try {
      // Validate required fields
      if (!selectedFood.name || !selectedFood.description || !selectedFood.price || !selectedFood.category || !selectedFood.image) {
        toast.error('Please fill in all required fields including image');
        setIsEditingFood(false);
        return;
      }

      console.log('Sending updated food data:', selectedFood);

      const response = await fetch(`http://localhost:5000/api/foods/${selectedFood._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedFood),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update food');
      }

      const updatedFood = await response.json();
      setFoods(foods.map(food => food._id === updatedFood._id ? updatedFood : food));
      setIsEditFoodDialogOpen(false);
      setSelectedFood(null);
      toast.success('Food item updated successfully');
    } catch (error) {
      console.error('Error updating food:', error);
      toast.error(error.message || 'Failed to update food item');
    } finally {
      setIsEditingFood(false);
    }
  };

  const handleDeleteFood = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/foods/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete food');
      }

      setFoods(foods.filter(food => food._id !== id));
      toast.success('Food item deleted successfully');
    } catch (error) {
      console.error('Error deleting food:', error);
      toast.error(error.message || 'Failed to delete food item');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      const food = foods.find(f => f._id === id);
      if (!food) throw new Error('Food item not found');

      const response = await fetch(`http://localhost:5000/api/foods/${id}/toggle-availability`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAvailable: !food.isAvailable }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to toggle availability');
      }

      const updatedFood = await response.json();
      setFoods(foods.map(food => food._id === updatedFood._id ? updatedFood : food));
      toast.success('Food availability updated');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error(error.message || 'Failed to update food availability');
    }
  };

  const handleApproveContent = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${id}/approve`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to approve content');

      const updatedPost = await response.json();
      setPosts(posts.map(post => post._id === updatedPost._id ? updatedPost : post));
      toast.success('Content approved and published!');
    } catch (error) {
      toast.error('Failed to approve content');
    }
  };

  const handleRejectContent = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${id}/reject`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to reject content');

      const updatedPost = await response.json();
      setPosts(posts.map(post => post._id === updatedPost._id ? updatedPost : post));
      toast.info('Content rejected and notified to author');
    } catch (error) {
      toast.error('Failed to reject content');
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update order status');

      const updatedOrder = await response.json();
      setOrders(orders.map(order => order._id === updatedOrder.order._id ? updatedOrder.order : order));
      toast.success(`Order #${id} status updated to ${status}`);
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const userInfo = localStorage.getItem('user-info');
      const token = userInfo ? JSON.parse(userInfo).token : null;

      // Read optional image file as base64 data URL
      let imageBase64: string | undefined = undefined;
      const imageFile = formData.get('image') as File | null;
      if (imageFile && imageFile.size > 0) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(imageFile);
        });
      }

      const response = await fetch('http://localhost:5000/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          title: formData.get('title'),
          message: formData.get('message'),
          image: imageBase64
        }),
      });

      if (!response.ok) throw new Error('Failed to send announcement');

      toast.success('Announcement sent to all users!');
      form.reset();
    } catch (error) {
      toast.error('Failed to send announcement');
    }
  };



  return (
    <DefaultLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <Badge className="bg-yendine-navy text-white">Admin Access</Badge>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} >
          <TabsList className="flex flex-wrap lg:grid lg:grid-cols-8 mb-8 w-full h-full ">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="orders">Food Orders</TabsTrigger>
            <TabsTrigger value="foods">Food Management</TabsTrigger>
            <TabsTrigger value="seats">Seat Management</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Total Orders Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orderStats?.totalOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">All time orders</p>
                </CardContent>
              </Card>

              {/* Pending Orders Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{orderStats?.pendingOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting preparation</p>
                </CardContent>
              </Card>

              {/* Preparing Orders Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Preparing</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{orderStats?.preparingOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">Currently preparing</p>
                </CardContent>
              </Card>

              {/* Total Revenue Card */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{orderStats?.totalRevenue || 0}</div>
                  <p className="text-xs text-muted-foreground">From completed orders</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Send Announcement</CardTitle>
                <CardDescription>Notify all users of important updates</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendAnnouncement} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Announcement Title</label>
                    <Input name="title" placeholder="Enter announcement title" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea name="message" placeholder="Enter announcement message" rows={4} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image (Optional)</label>
                    <Input type="file" name="image" accept="image/*" />
                  </div>
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      className="bg-yendine-orange hover:bg-yendine-orange/90 text-white"
                    >
                      Send to All Users
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Food Orders</CardTitle>
                <CardDescription>Manage and track food orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="p-3 text-left">Order ID</th>
                        <th className="p-3 text-left">User</th>
                        <th className="p-3 text-left">Items</th>
                        <th className="p-3 text-left">Total</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Payment</th>
                        <th className="p-3 text-left">Seats</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-3 text-center text-muted-foreground">
                            No orders found
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => (
                          <tr key={order._id} className="border-b">
                            <td className="p-3">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                #{order._id.slice(-8)}
                              </code>
                            </td>
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{order.userName}</p>
                                <p className="text-xs text-muted-foreground">{order.userId}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="max-w-xs">
                                {order.items.map((item, index) => (
                                  <div key={index} className="text-xs">
                                    {item.name} x{item.quantity} (₹{item.price})
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">₹{order.totalAmount}</td>
                            <td className="p-3">
                              <Badge className={
                                order.status === 'completed' ? 'bg-green-500' :
                                  order.status === 'preparing' ? 'bg-yellow-500' :
                                    order.status === 'ready' ? 'bg-blue-500' : 'bg-gray-500'
                              }>
                                {order.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <Badge variant="outline" className="text-xs">
                                  {order.paymentMethod}
                                </Badge>
                                <Badge className={
                                  order.paymentStatus === 'completed' ? 'bg-green-500' :
                                    order.paymentStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                                }>
                                  {order.paymentStatus}
                                </Badge>
                              </div>
                            </td>
                            <td className="p-3">
                              {order.selectedSeats.length > 0 ? (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  {order.selectedSeats.join(', ')}
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">No seats</span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Select
                                  value={order.status}
                                  onValueChange={(value) => handleUpdateOrderStatus(order._id, value)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="preparing">Preparing</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Food Management Tab */}
          <TabsContent value="foods">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Food Management</CardTitle>
                  <CardDescription>Manage food items and their availability</CardDescription>
                </div>
                <Dialog open={isAddFoodDialogOpen} onOpenChange={setIsAddFoodDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-yendine-navy hover:bg-yendine-navy/90 text-white">
                      Add Food Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Food Item</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddFood} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={newFood.name}
                          onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={newFood.description}
                          onChange={(e) => setNewFood({ ...newFood, description: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price</Label>
                        <Input
                          type="number"
                          value={newFood.price}
                          onChange={(e) => setNewFood({ ...newFood, price: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={newFood.category}
                          onValueChange={(value) => setNewFood({ ...newFood, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main">Main Course</SelectItem>
                            <SelectItem value="appetizer">Appetizer</SelectItem>
                            <SelectItem value="dessert">Dessert</SelectItem>
                            <SelectItem value="beverage">Beverage</SelectItem>
                            <SelectItem value="cooldrink">Cooldrink</SelectItem>
                            <SelectItem value="noodles">Noodles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Image</Label>
                        <ImageUpload
                          value={newFood.image}
                          onChange={(value) => setNewFood({ ...newFood, image: value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Preparation Time (minutes)</Label>
                        <Input
                          type="number"
                          value={newFood.preparationTime}
                          onChange={(e) => setNewFood({ ...newFood, preparationTime: Number(e.target.value) })}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-yendine-navy hover:bg-yendine-navy/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isAddingFood}
                      >
                        {isAddingFood ? (
                          <>
                            <span className="inline-block animate-spin mr-2"><Loader className="animate-spin size-3 text-white" /></span>
                            Adding Food Item...
                          </>
                        ) : (
                          'Add Food Item'
                        )}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Category</th>
                        <th className="p-3 text-left">Price</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foods.map((food) => (
                        <tr key={food._id} className="border-b">
                          <td className="p-3">{food.name}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">
                              {food.category}
                            </Badge>
                          </td>
                          <td className="p-3">₹{food.price}</td>
                          <td className="p-3">
                            <Badge className={food.isAvailable ? 'bg-green-500' : 'bg-red-500'}>
                              {food.isAvailable ? 'Available' : 'Unavailable'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedFood(food);
                                  setIsEditFoodDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleAvailability(food._id)}
                              >
                                {food.isAvailable ? 'Make Unavailable' : 'Make Available'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteFood(food._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Seat Management Tab */}
          <TabsContent value="seats">
            <Card>
              <CardHeader>
                <CardTitle>Seat Management Dashboard</CardTitle>
                <CardDescription>Monitor and view all seat bookings in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <SeatAdminDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Razorpay Payment Records</CardTitle>
                <CardDescription>View all successful Razorpay payments with user details and order information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted border-b">
                        <th className="p-3 text-left">User</th>
                        <th className="p-3 text-left">Order ID</th>
                        <th className="p-3 text-left">Payment ID</th>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Items</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-3 text-center text-muted-foreground">
                            No payment records found
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment) => (
                          <tr key={payment._id} className="border-b">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{payment.userName}</p>
                                <p className="text-xs text-muted-foreground">{payment.userId}</p>
                              </div>
                            </td>
                            <td className="p-3">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {payment.razorpayOrderId}
                              </code>
                            </td>
                            <td className="p-3">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {payment.razorpayPaymentId}
                              </code>
                            </td>
                            <td className="p-3">
                              <span className="font-bold">₹{payment.amount}</span>
                            </td>
                            <td className="p-3">
                              <div className="max-w-xs">
                                {payment.orderDetails.items.map((item, index) => (
                                  <div key={index} className="text-xs">
                                    {item.name} x{item.quantity} (₹{item.price})
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge className={
                                payment.status === 'completed' ? 'bg-green-500' :
                                  payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                              }>
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span className="text-xs text-muted-foreground">
                                {new Date(payment.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Feedback Tab */}
          <TabsContent value="feedback">
            <FeedbackDisplay
              showStats={true}
              showPagination={true}
              limit={10}
              showDelete={true}
              onDelete={(id) => {
                setFeedbacks(feedbacks.filter(fb => fb._id !== id));
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Food Dialog */}
      <Dialog open={isEditFoodDialogOpen} onOpenChange={setIsEditFoodDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Food Item</DialogTitle>
          </DialogHeader>
          {selectedFood && (
            <form onSubmit={handleUpdateFood} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={selectedFood.name}
                  onChange={(e) => setSelectedFood({ ...selectedFood, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={selectedFood.description}
                  onChange={(e) => setSelectedFood({ ...selectedFood, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Price</Label>
                <Input
                  type="number"
                  value={selectedFood.price}
                  onChange={(e) => setSelectedFood({ ...selectedFood, price: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedFood.category}
                  onValueChange={(value) => setSelectedFood({ ...selectedFood, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Course</SelectItem>
                    <SelectItem value="appetizer">Appetizer</SelectItem>
                    <SelectItem value="dessert">Dessert</SelectItem>
                    <SelectItem value="beverage">Beverage</SelectItem>
                    <SelectItem value="cooldrink">Cooldrink</SelectItem>
                    <SelectItem value="noodles">Noodles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <ImageUpload
                  value={selectedFood.image}
                  onChange={(value) => setSelectedFood({ ...selectedFood, image: value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Preparation Time (minutes)</Label>
                <Input
                  type="number"
                  value={selectedFood.preparationTime}
                  onChange={(e) => setSelectedFood({ ...selectedFood, preparationTime: Number(e.target.value) })}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-yendine-navy hover:bg-yendine-navy/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isEditingFood}
              >
                {isEditingFood ? (
                  <>
                    <span className="inline-block animate-spin mr-2"><Loader className="animate-spin size-3 text-white" /></span>
                    Updating Food Item...
                  </>
                ) : (
                  'Update Food Item'
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DefaultLayout>
  );
}
