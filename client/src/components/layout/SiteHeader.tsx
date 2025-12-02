
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, MonitorCogIcon } from "lucide-react";
import { checkAdminStatus } from "@/services/api";

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('user-info');
    if (userInfo) {
      const userData = JSON.parse(userInfo);
      setUser(userData);

      // Check admin status
      const checkAdmin = async () => {
        try {
          const result = await checkAdminStatus();
          setIsAdmin(result.isAdmin);
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } finally {
          setIsLoading(false);
        }
      };

      checkAdmin();
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user-info');

    // Clear all state
    setUser(null);
    setIsAdmin(false);
    setIsMenuOpen(false);

    // Redirect to login page
    navigate('/', { replace: true });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur   ">
      <div className="container flex h-[80px] items-center justify-between">
        <div className="flex items-center gap-2 justify-center ">
          <Link to="/home" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-quicktap-creamy  ">Quick Tap</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-quicktap-creamy">
          <Link to="/home" className="text-sm font-medium transition-colors hover:text-quicktap-creamy/40">
            Home
          </Link>
          <Link to="/food" className="text-sm font-medium transition-colors hover:text-quicktap-creamy/40">
            Food
          </Link>
          {/* <Link to="/community" className="text-sm font-medium transition-colors hover:text-quicktap-creamy/40">
            Community
          </Link> */}
          {isAdmin && (
            <Link to="/scan-qr" className="text-sm font-medium transition-colors hover:text-quicktap-creamy/40 flex items-center gap-1">
              QR Code
            </Link>
          )}
          <Link to="/chatbot" className="text-sm font-medium transition-colors hover:text-quicktap-creamy/40">
            Chatbot
          </Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm font-medium transition-colors hover:text-destructive flex items-center gap-2">
              <MonitorCogIcon size={16} />
              Admin
            </Link>
          )}
        </nav>

        {/* Auth Buttons or User Menu */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <Button asChild variant="default" size="sm" className="bg-quicktap-teal/70 hover:bg-quicktap-teal text-quicktap-creamy">
              <Link to="/">Login</Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="px-2 hover:bg-quicktap-green hover:text-white hover:duration-200 duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t py-4 px-6 text-quicktap-lightGray hover:text-quicktap-creamy">
          <nav className="flex flex-col space-y-4">
            <Link
              to="/home"
              className="text-base font-medium transition-colors hover:text-quicktap-creamy/40"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/food"
              className="text-base font-medium transition-colors hover:text-quicktap-creamy/40"
              onClick={() => setIsMenuOpen(false)}
            >
              Food
            </Link>
            <Link
              to="/community"
              className="text-base font-medium transition-colors hover:text-quicktap-creamy/40"
              onClick={() => setIsMenuOpen(false)}
            >
              Community
            </Link>
            {isAdmin && (
              <Link
                to="/scan-qr"
                className="text-base font-medium transition-colors hover:text-quicktap-creamy/40 flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                QR Code
              </Link>
            )}
            <Link
              to="/chatbot"
              className="text-base font-medium transition-colors hover:text-quicktap-creamy/40"
              onClick={() => setIsMenuOpen(false)}
            >
              Chatbot
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="text-base font-medium transition-colors hover:text-destructive flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <MonitorCogIcon size={16} />
                Admin
              </Link>
            )}

            {user ? (
              <div className="space-y-3 pt-4 border-t">

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-quicktap-teal "
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                <Link to="/" className="w-full">Login</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
