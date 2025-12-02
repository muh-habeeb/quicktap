
import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t [border-width:5px] border-border ">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">Quick-Tap</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Your one-stop platform for food delivery, convenience, and community engagement.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Pages</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/food" className="text-sm text-muted-foreground hover:text-foreground">
                    Food Ordering
                  </Link>
                </li>
                {/* <li>
                  <Link to="/community" className="text-sm text-muted-foreground hover:text-foreground">
                    Community
                  </Link>
                </li> */}
                <li>
                  <Link to="/chatbot" className="text-sm text-muted-foreground hover:text-foreground">
                    Ai assistant
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Help</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Stay Connected</h3>
            <p className="text-sm text-muted-foreground">
              Follow us on social media for the latest updates and announcements.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Facebook
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Instagram
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Twitter
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Quick Tap. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
