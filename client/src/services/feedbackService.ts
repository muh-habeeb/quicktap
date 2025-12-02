export interface Feedback {
  _id: string;
  feedback: string;
  userEmail?: string;
  userName?: string;
  createdAt: string;
}

export interface FeedbackResponse {
  feedback: Feedback[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreateFeedbackRequest {
  feedback: string;
  userEmail?: string;
  userName?: string;
}

import { API_URL } from '../api';

const API_BASE_URL = `${API_URL}/api`;

export class FeedbackService {
  // Get all feedback with pagination and sorting
  static async getFeedback(params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }): Promise<FeedbackResponse> {
    const searchParams = new URLSearchParams();
    
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.sort) searchParams.append('sort', params.sort);
    if (params?.order) searchParams.append('order', params.order);

    const response = await fetch(`${API_BASE_URL}/feedbacks?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch feedback: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get feedback by ID
  static async getFeedbackById(id: string): Promise<Feedback> {
    const response = await fetch(`${API_BASE_URL}/feedbacks/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Feedback not found');
      }
      throw new Error(`Failed to fetch feedback: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Create new feedback
  static async createFeedback(data: CreateFeedbackRequest): Promise<{ message: string; feedback: Feedback }> {
    const response = await fetch(`${API_BASE_URL}/feedbacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create feedback: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Delete feedback by ID
  static async deleteFeedback(id: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/feedbacks/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Feedback not found');
      }
      throw new Error(`Failed to delete feedback: ${response.statusText}`);
    }
    
    return response.json();
  }

  // Get recent feedback (last 5)
  static async getRecentFeedback(): Promise<Feedback[]> {
    const response = await this.getFeedback({ limit: 5, sort: 'createdAt', order: 'desc' });
    return response.feedback;
  }

  // Get feedback statistics
  static async getFeedbackStats(): Promise<{
    totalFeedback: number;
    recentFeedback: number;
    averageLength: number;
  }> {
    const response = await this.getFeedback({ limit: 1000 }); // Get all for stats
    const allFeedback = response.feedback;
    
    const totalFeedback = allFeedback.length;
    const recentFeedback = allFeedback.filter(f => {
      const createdAt = new Date(f.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return createdAt > oneWeekAgo;
    }).length;
    
    const averageLength = allFeedback.length > 0 
      ? allFeedback.reduce((sum, f) => sum + f.feedback.length, 0) / allFeedback.length 
      : 0;
    
    return {
      totalFeedback,
      recentFeedback,
      averageLength: Math.round(averageLength),
    };
  }
}
