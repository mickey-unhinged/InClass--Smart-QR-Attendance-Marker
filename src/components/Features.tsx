import { CheckCircle2, Users, BarChart3, Calendar, MessageSquare, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: CheckCircle2,
    title: "Assignment Management",
    description: "Create, distribute, and track assignments effortlessly with our intuitive interface.",
    color: "text-primary"
  },
  {
    icon: Users,
    title: "Student Collaboration",
    description: "Foster teamwork with built-in tools for group projects and peer reviews.",
    color: "text-secondary"
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description: "Monitor student performance with detailed analytics and visual reports.",
    color: "text-accent"
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Organize classes, deadlines, and events in one unified calendar.",
    color: "text-primary"
  },
  {
    icon: MessageSquare,
    title: "Real-time Communication",
    description: "Stay connected with instant messaging and announcements.",
    color: "text-secondary"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for speed and reliability, ensuring smooth performance every time.",
    color: "text-accent"
  }
];

const Features = () => {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-foreground">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to make classroom management simple and effective
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index}
                className="group p-6 hover:shadow-lg transition-all duration-300 border-border bg-card hover:scale-[1.02] cursor-pointer"
              >
                <div className="space-y-4">
                  <div className={`inline-flex p-3 rounded-xl bg-muted ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
