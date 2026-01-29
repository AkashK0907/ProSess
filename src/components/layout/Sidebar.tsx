import { NavLink, useLocation } from "react-router-dom";
import { Timer, TrendingUp, BarChart3, Settings, Music, User, Menu } from "lucide-react";

const navItems = [
  { label: "Sessions", path: "/", icon: Timer },
  { label: "Tracker", path: "/tracker", icon: TrendingUp },
  { label: "Stats", path: "/stats", icon: BarChart3 },
  { label: "Edit", path: "/edit", icon: Settings },
  { label: "Music", path: "/music", icon: Music },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
  onItemClick?: () => void;
}

export function Sidebar({ isCollapsed, onToggle, className = "", onItemClick }: SidebarProps) {
  const location = useLocation();

  return (
    <aside 
      className={`h-screen bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border/50 flex flex-col z-20 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-60"
      } ${className}`}
    >
      {/* Logo and Toggle Button */}
      {/* Logo and Toggle Button */}
      <div className="px-6 py-8 relative">
        {!isCollapsed && (
          <>
            <h1 className="text-2xl font-bold gradient-text tracking-tight">
              ProSess
            </h1>
            <div className="mt-1 text-xs text-muted-foreground">Focus & Flow</div>
          </>
        )}
        {isCollapsed && (
          <h1 className="text-2xl font-bold gradient-text tracking-tight text-center">
            P
          </h1>
        )}
        
        {/* Toggle Button - Top Right of Sidebar */}
        <button
          onClick={onToggle}
          className="absolute top-8 right-4 w-8 h-8 rounded-lg bg-sidebar/80 backdrop-blur-xl border border-sidebar-border/50 flex items-center justify-center hover:bg-sidebar transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path} className={`animate-slide-in-right stagger-${Math.min(index + 1, 6)}`}>
                <NavLink
                  to={item.path}
                  onClick={onItemClick}
                  className={`nav-item ${isActive ? "nav-item-active" : ""} ${
                    isCollapsed ? "justify-center px-3" : ""
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5" strokeWidth={1.5} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Profile */}
      <div className="px-3 pb-6">
        <NavLink
          to="/profile"
          onClick={onItemClick}
          className={`nav-item ${location.pathname === "/profile" ? "nav-item-active" : ""} ${
            isCollapsed ? "justify-center px-3" : ""
          }`}
          title={isCollapsed ? "Profile" : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-primary/30">
            <User className="w-4 h-4 text-foreground" strokeWidth={1.5} />
          </div>
          {!isCollapsed && <span className="font-medium">Profile</span>}
        </NavLink>
      </div>
    </aside>
  );
}
