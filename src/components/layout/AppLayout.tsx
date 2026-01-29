import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full relative overflow-hidden bg-background text-foreground">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background via-background to-secondary/20 animate-gradient" />

      {/* Floating decorative orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-1/3 w-80 h-80 bg-gradient-to-br from-accent/8 to-transparent rounded-full blur-3xl animate-float-delay-1" />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-primary/8 to-transparent rounded-full blur-3xl animate-float-delay-2" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-br from-accent/6 to-transparent rounded-full blur-3xl animate-float-delay-3" />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full z-30">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border/50">
         <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold gradient-text tracking-tight">ProSess</h1>
         </div>
         <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
           <SheetTrigger asChild>
             <button className="p-2 -mr-2 text-foreground hover:bg-secondary/50 rounded-md">
               <Menu className="w-6 h-6" />
             </button>
           </SheetTrigger>
           <SheetContent side="left" className="p-0 w-72 border-r-border/50 bg-background/95 backdrop-blur-xl">
             <Sidebar 
               isCollapsed={false} 
               onToggle={() => setIsMobileOpen(false)} // Use toggle button to close sheet on mobile
               onItemClick={() => setIsMobileOpen(false)}
               className="h-full border-none bg-transparent w-full"
             />
           </SheetContent>
         </Sheet>
      </div>
      
      <main 
        className={`relative z-10 flex-1 transition-all duration-300 w-full pt-16 md:pt-0 ${
          isSidebarCollapsed ? "md:ml-20" : "md:ml-60"
        }`}
      >
        <div className="page-content px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </div>
  );
}
