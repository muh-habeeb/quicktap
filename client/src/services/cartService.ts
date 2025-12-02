import { API_URL } from '../api';

const API_BASE_URL = `${API_URL}/api/cart`;

export interface CartItem {
  _id: string;
  foodId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export class CartService {
  // Get user's cart
  static async getCart(userId: string): Promise<Cart> {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }
      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw error;
    }
  }

  // Add item to cart
  static async addToCart(userId: string, item: {
    foodId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    category?: string;
  }): Promise<Cart> {
    try {
      const response = await fetch(`${API_BASE_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...item
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }

  // Update item quantity in cart
  static async updateQuantity(userId: string, foodId: string, quantity: number): Promise<Cart> {
    try {
      const response = await fetch(`${API_BASE_URL}/update-quantity`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          foodId,
          quantity
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cart');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  }

  // Remove item from cart
  static async removeFromCart(userId: string, foodId: string): Promise<Cart> {
    try {
      const response = await fetch(`${API_BASE_URL}/remove`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          foodId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Error removing item from cart:', error);
      throw error;
    }
  }

  // Clear cart
  static async clearCart(userId: string): Promise<Cart> {
    try {
      const response = await fetch(`${API_BASE_URL}/clear/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }

      const data = await response.json();
      return data.cart;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }
}
