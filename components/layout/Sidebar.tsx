"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Briefcase, 
  LayoutDashboard, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Boards", href: "/" },
  { icon: Users, label: "Members", href: "/members" },
  { icon: Settings, label: "Workspace settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "h-full bg-surface-container border-r border-[#091e4224] transition-all duration-300 ease-in-out shrink-0 relative flex flex-col hidden sm:flex z-20",
        collapsed ? "w-16" : "w-[240px]"
      )}
    >
      {/* Workspace Header */}
      <div className="p-4 flex items-center gap-3 border-b border-[#091e4224]">
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary font-bold shadow-sm shrink-0">
          W
        </div>
        {!collapsed && (
          <div className="flex-col flex overflow-hidden">
            <span className="font-semibold text-sm truncate text-on-surface">Main Workspace</span>
            <span className="text-xs text-on-surface-variant truncate">Free</span>
          </div>
        )}
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 w-6 h-6 bg-surface-container border border-[#091e4224] rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors shadow-sm text-on-surface-variant z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {!collapsed && (
          <h3 className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mt-2">
            Your views
          </h3>
        )}
        
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors",
                isActive
                  ? "bg-primary-fixed text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-on-surface-variant")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
