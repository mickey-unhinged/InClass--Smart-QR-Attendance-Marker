import { Button } from "@/components/ui/button";
import { BookOpen, Menu } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              InClass
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost">
              Sign In
            </Button>
            <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-6 w-6 text-foreground" />
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Features
              </a>
              <a href="#about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                About
              </a>
              <a href="#pricing" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Pricing
              </a>
              <a href="#contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <Button variant="ghost" className="w-full">
                  Sign In
                </Button>
                <Button className="w-full bg-gradient-to-r from-primary to-accent">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
