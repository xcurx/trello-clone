"use client";

import { CreateBoardPopover } from "@/components/board/CreateBoardPopover";

export function CreateBoardTile() {
  return (
    <CreateBoardPopover
      containerClassName="block w-full"
      side="right"
      align="center"
      trigger={
        <button className="h-[100px] w-full rounded-lg p-3 flex items-center justify-center bg-surface-container-low hover:bg-surface-container hover:-translate-y-0.5 transition-all outline-dashed outline-2 outline-offset-[-2px] outline-outline-variant text-on-surface-variant group">
          <span className="font-medium text-sm group-hover:text-primary transition-colors">
            Create new board
          </span>
        </button>
      }
    />
  );
}
