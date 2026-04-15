import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";

export function Navbar() {
  return (
    <nav className="h-12 bg-primary text-on-primary flex items-center justify-between px-3 box-border shadow-navbar z-50 shrink-0">
      <div className="flex items-center gap-4">
        {/* Logo area */}
        <Link
          href="/"
          className="font-inter font-semibold text-xl tracking-tight opacity-90 hover:opacity-100 flex items-center gap-1 transition-opacity"
        >
          <div className="w-4 h-4 bg-on-primary rounded-sm opacity-80" />
          Trello
        </Link>
        {/* Main Links */}
        <div className="hidden md:flex items-center gap-1">
          {["Workspaces", "Recent", "Starred"].map((item) => (
            <button
              key={item}
              className="text-sm px-3 py-1.5 rounded-sm bg-transparent hover:bg-white/10 font-medium transition-colors"
            >
              {item}
            </button>
          ))}
          <button className="ml-2 text-sm px-3 py-1.5 rounded-sm bg-white/20 hover:bg-white/30 font-medium transition-colors flex items-center gap-1">
            Create
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
          <input
            type="text"
            placeholder="Search tasks, labels..."
            className="h-8 w-50 focus:w-[400px] transition-[width] bg-white/20 hover:bg-white/30 focus:bg-white focus:text-on-surface focus:placeholder:text-on-surface-variant text-sm px-8 rounded-sm outline-none text-white placeholder:text-white/70"
          />
        </div>
        <button className="md:hidden w-8 h-8 flex items-center justify-center rounded-sm bg-white/20 hover:bg-white/30 text-white">
          <Plus className="w-5 h-5" />
        </button>
        <Avatar name="User" size="md" className="cursor-pointer" />
      </div>
    </nav>
  );
}
