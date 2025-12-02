import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Food from "./pages/Food";
import Community from "./pages/Community";
import Chatbot from "./pages/Chatbot";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import { GoogleOAuthProvider } from "@react-oauth/google";
import GoogleLogin from "./pages/GoogleLogin";
import { AdminRoute } from "./components/AdminRoute";
import QRCodeScanner from "./components/QRCodeScanner";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const userInfo = localStorage.getItem('user-info');
    if (userInfo) {
      setIsAuthenticated(true);
    }
  }, []);

  const PrivateRoute = ({ element }) => {
    const userInfo = localStorage.getItem('user-info');
    
    if (!userInfo) {
      // User not authenticated - store the current URL with params for redirect after login
      const currentUrl = window.location.pathname + window.location.search;
      console.log('🔐 [PrivateRoute] User not authenticated. Storing redirect URL:', currentUrl);
      localStorage.setItem('redirectAfterLogin', currentUrl);
      return <Navigate to="/" replace />;
    }
    
    return element;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                  <GoogleLogin />
                </GoogleOAuthProvider>
              }
            />
            <Route path='/home' element={<Home />} />
            <Route path="/food" element={<PrivateRoute element={<Food />} />} />
            <Route path="/community" element={<PrivateRoute element={<Community />} />} />
            <Route path="/chatbot" element={<PrivateRoute element={<Chatbot />} />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/scan-qr" element={<PrivateRoute element={<QRCodeScanner />} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
