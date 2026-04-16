"use client";

import {
  Bell,
  CircleHelp,
  Megaphone,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { CreateBoardPopover } from "@/components/board/CreateBoardPopover";
import { NavbarBoardSearch } from "@/components/layout/NavbarBoardSearch";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Popover } from "@/components/ui/Popover";

export function Navbar() {
  return (
    <nav className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 bg-[#1a1d21] px-2.5 text-white sm:px-4">
      <Link
        href="/"
        className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-white/8"
        aria-label="Trello"
      >
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[#0c66e4] shadow-[inset_0_-1px_0_rgba(0,0,0,0.24)]">
          <div className="flex gap-1">
            <span className="block h-3.5 w-1.5 rounded-sm bg-white" />
            <span className="block h-3.5 w-1.5 rounded-sm bg-white/85" />
          </div>
        </div>
        <span className="hidden text-[19px] font-semibold tracking-tight lg:inline">
          Trello
        </span>
      </Link>

      <div className="mx-auto flex max-w-[820px] flex-1 items-center justify-center gap-2 md:justify-start">
        <NavbarBoardSearch />

        <button
          type="button"
          aria-label="Search"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>

        <CreateBoardPopover
          side="bottom"
          align="center"
          contentClassName="border border-white/12 bg-[#2b2e38] text-white"
          trigger={
            <button
              type="button"
              className="inline-flex h-8 items-center rounded-md bg-[#579dff] px-3 text-sm font-medium text-[#082145] transition-colors hover:bg-[#85b8ff]"
            >
              Create
            </button>
          }
        />
      </div>

      <div className="ml-auto hidden items-center gap-1 min-[820px]:flex">
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

      <div className="ml-auto min-[820px]:hidden">
        <Popover
          trigger={
            <button
              type="button"
              aria-label="More"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          side="bottom"
          align="end"
          contentClassName="w-[250px] border border-white/10 bg-[#2b2e38] text-white"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Avatar
                name="SK"
                size="md"
                className="bg-[#ff9f1a] text-[#2a1600]"
              />
              <span className="text-sm font-medium text-white/88">Account</span>
            </div>

            {[
              { icon: Megaphone, label: "Feedback" },
              { icon: Bell, label: "Notifications" },
              { icon: CircleHelp, label: "Information" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8"
              >
                <Icon className="h-4 w-4 text-white/65" />
                {label}
              </button>
            ))}
          </div>
        </Popover>
      </div>
    </nav>
  );
}
