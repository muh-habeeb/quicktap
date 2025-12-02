import { useState, useRef, ChangeEvent, useEffect } from "react";
import { DefaultLayout } from "@/components/layout/DefaultLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Image, X, Heart, HeartOff, Trash2 } from "lucide-react";
import { detectHateSpeech } from "@/utils/hateDetection";
import { postService } from "@/services/api";
import { API_URL } from "@/api";

// Types for our data
interface Comment {
  _id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface Post {
  _id: string;
  category: string;
  author: string;
  avatar: string;
  timestamp: string;
  title: string;
  content: string;
  image: { url: string; public_id: string } | string | null;
  likes: number;
  comments: Comment[];
  likedBy: string[];
  createdAt?: string;
  updatedAt?: string;
  isAnnouncement?: boolean;
}

interface CurrentUser {
  id: string;
  name: string;
  avatar: string;
}

// Post component
function Post({ post, onLike, onAddComment, onDeletePost, onDeleteComment, currentUser }: { post: Post; onLike: any; onAddComment: any; onDeletePost: any; onDeleteComment: any; currentUser: CurrentUser }) {
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const hasUserLiked = post.likedBy.includes(currentUser.id);
  const isAuthor = post.author === currentUser.name;
  const displayAuthor = post.isAnnouncement ? 'Admin' : post.author;

  const handleAddComment = () => {
    if (!comment.trim()) return;

    // Check for hate speech before adding comment
    const hateSpeechResult = detectHateSpeech(comment);

    if (hateSpeechResult.isHateSpeech) {
      toast.error("Your comment contains inappropriate language and cannot be posted.", {
        description: hateSpeechResult.reason
      });
      return;
    }

    onAddComment(post._id, comment);
    setComment("");
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.avatar} alt={displayAuthor} />
              <AvatarFallback>{displayAuthor.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayAuthor}</p>
              <p className="text-xs text-muted-foreground">{post.timestamp}</p>
            </div>
          </div>
          {isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDeletePost(post._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {post.title && <CardTitle className="mt-2">{post.title}</CardTitle>}
      </CardHeader>
      <CardContent className="space-y-4">
        <p>{post.content}</p>
        {post.image && (
          <div className="rounded-md overflow-hidden">
            <img
              src={typeof post.image === 'string' ? post.image : post.image.url}
              alt="Post attachment"
              className="w-full h-auto max-h-[400px] object-contain"
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex justify-between items-center w-full">
          <Button
            variant="ghost"
            size="sm"
            className="flex gap-1 items-center"
            onClick={() => onLike(post._id)}
          >
            {hasUserLiked ? (
              <HeartOff className="mr-1 h-4 w-4 text-red-500" />
            ) : (
              <Heart className={`mr-1 h-4 w-4 ${hasUserLiked ? 'text-red-500 fill-red-500' : ''}`} />
            )}
            {post.likes} {hasUserLiked && "(Liked)"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex gap-1 items-center"
            onClick={() => setShowComments(!showComments)}
          >
            💬 {post.comments.length} {post.comments.length === 1 ? "Comment" : "Comments"}
          </Button>
        </div>

        {showComments && (
          <>
            <div className="w-full space-y-3">
              {post.comments.map(comment => (
                <div key={comment._id} className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{comment.author}</p>
                      <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                    </div>
                    {comment.author === currentUser.name && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => onDeleteComment(post._id, comment._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 w-full">
              <Textarea
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="resize-none"
              />
              <Button
                onClick={handleAddComment}
                disabled={!comment.trim()}
                className="bg-quicktap-navy hover:bg-quicktap-navy/90 text-white"
              >
                Post
              </Button>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}

// New post form component
function NewPostForm({ category, onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Check for hate speech before submitting
    const hateSpeechResult = detectHateSpeech(content);
    const titleHateSpeechResult = detectHateSpeech(title);

    if (hateSpeechResult.isHateSpeech || titleHateSpeechResult.isHateSpeech) {
      toast.error("Your post contains inappropriate language and cannot be published.", {
        description: hateSpeechResult.isHateSpeech ? hateSpeechResult.reason : titleHateSpeechResult.reason
      });
      return;
    }

    onSubmit({
      category,
      title,
      content,
      imageFile: image,
      image: imagePreview // In a real app, you'd upload the file to a server and get back a URL
    });

    setTitle("");
    setContent("");
    removeImage();
  };

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg">Create a New {category === "yit" ? "Post" : "Event"}</CardTitle>
          <CardDescription>
            Share {category === "yit" ? "updates with the campus community" : "information about upcoming events"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder={`Enter ${category === "yit" ? "post" : "event"} title`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <Textarea
              placeholder={`What's on your mind?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[120px] resize-none"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Image (Optional)</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex gap-2 items-center"
              >
                <Image size={20} />
                Upload Image
              </Button>
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded-md object-contain bg-muted p-2"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full"
                    onClick={removeImage}
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-quicktap-teal hover:bg-quicktap-teal/90 text-white"
            disabled={!title.trim() || !content.trim()}
          >
            Post {category === "yit" ? "Update" : "Event"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function Community() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState("yit");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ id: 'guest', name: 'You', avatar: '/placeholder.svg' });

  useEffect(() => {
    // Load real user from localStorage if available
    try {
      const stored = localStorage.getItem('user-info');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser({ id: parsed.email || 'guest', name: parsed.name || 'You', avatar: parsed.image || '/placeholder.svg' });
      }
    } catch (error) {
      console.error("Error loading user info from localStorage:", error);
    }
  }, []);

  // Load posts from API (and announcements mapped as posts)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // 1) Fetch normal posts
        const data = await postService.getAllPosts();
        const normalizedPosts = data.map((post: any) => ({
          ...post,
          image: typeof post.image === 'string'
            ? post.image
              ? { url: post.image, public_id: '' }
              : null
            : post.image,
          isAnnouncement: false
        }));

        // 2) Fetch announcements and map to posts
        const annRes = await fetch(`${API_URL}/api/announcements`);
        const annJson = await annRes.json();
        const announcements = Array.isArray(annJson.announcements) ? annJson.announcements : [];
        const announcementPosts: Post[] = announcements.map((a: any) => ({
          _id: a._id,
          category: 'yit',
          author: a.createdBy || 'Admin',
          avatar: '/placeholder.svg',
          timestamp: new Date(a.createdAt).toLocaleString(),
          title: a.title,
          content: a.message,
          image: a.imageUrl || null,
          likes: 0,
          comments: [],
          likedBy: [],
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          isAnnouncement: true
        }));

        // 3) Merge and sort
        const merged = [...announcementPosts, ...normalizedPosts].sort((a: any, b: any) => {
          const da = new Date(a.createdAt || a.timestamp || 0).getTime();
          const db = new Date(b.createdAt || b.timestamp || 0).getTime();
          return db - da;
        });

        setPosts(merged);
      } catch (error) {
        toast.error("Failed to load community feed");
        console.error("Error loading posts/announcements:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Filter posts based on active tab
  const filteredPosts = posts.filter(post => post.category === activeTab);

  // Handle creating a new post
  const handleNewPost = async (postData) => {
    try {
      const newPost = {
        ...postData,
        author: currentUser.name,
        avatar: currentUser.avatar,
        timestamp: "Just now",
        likes: 0,
        comments: [],
        likedBy: []
      };

      const savedPost = await postService.createPost(newPost);
      // Normalize image property
      const normalized = {
        ...savedPost,
        image: typeof savedPost.image === 'string'
          ? savedPost.image
            ? { url: savedPost.image, public_id: '' }
            : null
          : savedPost.image,
        isAnnouncement: false
      };
      setPosts([normalized, ...posts]);
      toast.success(`Your ${postData.category === "yit" ? "post" : "event"} has been shared!`);
    } catch (error) {
      toast.error("Failed to create post");
      console.error("Error creating post:", error);
    }
  };

  // Handle liking/unliking a post
  const handleLikePost = async (postId) => {
    try {
      const updatedPost = await postService.toggleLike(postId, currentUser.id);
      setPosts(posts.map(post =>
        post._id === postId ? updatedPost : post
      ));
      toast.success(updatedPost.likedBy.includes(currentUser.id) ? "Post liked!" : "Post unliked");
    } catch (error) {
      toast.error("Failed to update like status");
      console.error("Error updating like:", error);
    }
  };

  // Handle adding a comment
  const handleAddComment = async (postId, commentText) => {
    try {
      const commentData = {
        author: currentUser.name,
        content: commentText,
        timestamp: "Just now"
      };

      const updatedPost = await postService.addComment(postId, commentData);
      setPosts(posts.map(post =>
        post._id === postId ? updatedPost : post
      ));
      toast.success("Comment added successfully!");
    } catch (error) {
      toast.error("Failed to add comment");
      console.error("Error adding comment:", error);
    }
  };

  // Handle deleting a post
  const handleDeletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts(posts.filter(post => post._id !== postId));
      toast.success("Post deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete post");
      console.error("Error deleting post:", error);
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (postId, commentId) => {
    try {
      const updatedPost = await postService.deleteComment(postId, commentId);
      setPosts(posts.map(post =>
        post._id === postId ? updatedPost : post
      ));
      toast.success("Comment deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete comment");
      console.error("Error deleting comment:", error);
    }
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="container py-8">
          <div className="text-center">Loading posts...</div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Campus Community</h1>

        <Tabs defaultValue="yit" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="yit">YIT Updates</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="yit" className="space-y-6">
            <NewPostForm category="yit" onSubmit={handleNewPost} />

            <div>
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <Post
                    key={post._id}
                    post={post}
                    onLike={handleLikePost}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={handleDeleteComment}
                    currentUser={currentUser}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No posts yet. Be the first to share an update!</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <NewPostForm category="events" onSubmit={handleNewPost} />

            <div>
              {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                  <Post
                    key={post._id}
                    post={post}
                    onLike={handleLikePost}
                    onAddComment={handleAddComment}
                    onDeletePost={handleDeletePost}
                    onDeleteComment={handleDeleteComment}
                    currentUser={currentUser}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No events posted yet. Share an upcoming event!</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DefaultLayout>
  );
}
