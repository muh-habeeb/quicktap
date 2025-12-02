import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FeedbackService, Feedback } from "@/services/feedbackService";

interface FeedbackDisplayProps {
  showStats?: boolean;
  showPagination?: boolean;
  limit?: number;
  showDelete?: boolean;
  onDelete?: (id: string) => void;
}

export function FeedbackDisplay({ 
  showStats = false, 
  showPagination = true, 
  limit = 10,
  showDelete = false,
  onDelete
}: FeedbackDisplayProps) {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [stats, setStats] = useState<{
    totalFeedback: number;
    recentFeedback: number;
    averageLength: number;
  } | null>(null);

  const fetchFeedback = async (page = 1) => {
    try {
      setLoading(true);
      const response = await FeedbackService.getFeedback({
        page,
        limit,
        sort: 'createdAt',
        order: 'desc'
      });
      
      setFeedback(response.feedback);
      setCurrentPage(response.pagination.currentPage);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.totalItems);
    } catch (error) {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await FeedbackService.getFeedbackStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  useEffect(() => {
    fetchFeedback();
    if (showStats) {
      fetchStats();
    }
  }, [showStats]);

  const handleDelete = async (id: string) => {
    try {
      await FeedbackService.deleteFeedback(id);
      toast.success("Feedback deleted successfully");
      fetchFeedback(currentPage); // Refresh current page
      onDelete?.(id);
    } catch (error) {
      toast.error("Failed to delete feedback");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      {showStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentFeedback}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Length</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageLength} chars</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        {feedback.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No feedback available</p>
            </CardContent>
          </Card>
        ) : (
          feedback.map((item) => (
            <Card key={item._id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.userName || 'Anonymous'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  {showDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item._id)}
                      className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{item.feedback}</p>
                {item.userEmail && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Contact: {item.userEmail}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFeedback(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages} ({totalItems} total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFeedback(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
