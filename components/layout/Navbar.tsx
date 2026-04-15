import { Bell, CircleHelp, LayoutGrid, Megaphone, Search } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export function Navbar() {
  return (
    <nav className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-[#1a1d21] px-4 text-white">
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Workspace menu"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>

      <Link
        href="/"
        className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-white/8"
      >
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[#0c66e4] shadow-[inset_0_-1px_0_rgba(0,0,0,0.24)]">
          <div className="flex gap-1">
            <span className="block h-3.5 w-1.5 rounded-sm bg-white" />
            <span className="block h-3.5 w-1.5 rounded-sm bg-white/85" />
          </div>
        </div>
        <span className="text-[19px] font-semibold tracking-tight">Trello</span>
      </Link>

      <div className="mx-auto hidden max-w-[780px] flex-1 items-center gap-3 md:flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
          <input
            type="text"
            placeholder="Search"
            className="h-8 w-full rounded-md border border-white/16 bg-white/6 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/26 focus:bg-white/10"
          />
        </div>
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md bg-[#579dff] px-3 text-sm font-medium text-[#082145] transition-colors hover:bg-[#85b8ff]"
        >
          Create
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className="hidden h-8 items-center rounded-md bg-[#d16cff] px-3 text-sm font-medium text-[#2c1333] md:inline-flex"
        >
          14 days left
        </button>

        {[
          { icon: Megaphone, label: "Announcements" },
          { icon: Bell, label: "Notifications" },
          { icon: CircleHelp, label: "Help" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}

        <Avatar
          name="SK"
          size="md"
          className="ml-1 bg-[#ff9f1a] text-[#2a1600]"
        />
      </div>
    </nav>
  );
}
