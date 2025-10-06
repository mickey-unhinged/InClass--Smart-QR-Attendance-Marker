import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-classroom.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-accent to-secondary py-20 lg:py-32">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6bS0yMCAyMGMwLTQuNDE4IDMuNTgyLTggOC04czggMy41ODIgOCA4LTMuNTgyIDgtOCA4LTgtMy41ODItOC04eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
      
      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="text-center lg:text-left space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/30">
              <BookOpen className="h-4 w-4" />
              <span>The Future of Education</span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Welcome to
              <span className="block mt-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                InClass
              </span>
            </h1>
            
            <p className="text-lg text-white/90 sm:text-xl max-w-2xl mx-auto lg:mx-0">
              Transform your classroom experience with our intuitive platform. Manage assignments, track progress, and engage students like never before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary transition-all duration-300"
              >
                Watch Demo
              </Button>
            </div>
          </div>
          
          <div className="relative lg:block">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500">
              <img
                src={heroImage}
                alt="Students collaborating in modern classroom"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary rounded-full blur-3xl opacity-50 animate-pulse"></div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent rounded-full blur-3xl opacity-50 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
