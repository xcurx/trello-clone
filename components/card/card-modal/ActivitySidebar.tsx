"use client";

import { format } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { CardModalState } from "@/types/card-modal";
import { toRelativeActivityTime } from "./utils";

interface ActivitySidebarProps {
  card: CardModalState;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onAddComment: () => void;
}

export function ActivitySidebar({
  card,
  newComment,
  onNewCommentChange,
  onAddComment,
}: ActivitySidebarProps) {
  return (
    <aside className="border-t border-white/10 bg-[#1f2229]/70 px-5 pb-6 pt-5 lg:border-l lg:border-t-0">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-white/82" />
          <h3 className="text-[20px] font-semibold text-white/88">
            Comments and activity
          </h3>
        </div>

        <button
          type="button"
          className="rounded-md bg-white/8 px-3 py-1.5 text-sm font-medium text-white/88 transition-colors hover:bg-white/12"
        >
          Show details
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          className="h-10 w-full rounded-md bg-[#2d313b] px-3 text-sm text-white outline-none transition-colors placeholder:text-white/48 focus:bg-[#353a45]"
          placeholder="Write a comment..."
          value={newComment}
          onChange={(event) => onNewCommentChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onAddComment();
            }
          }}
        />
      </div>

      <div className="space-y-4 overflow-y-auto pr-1">
        {card.comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <Avatar
              src={comment.member.avatarUrl}
              name={comment.member.name}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/92">
                  {comment.member.name}
                </span>
                <span
                  title={format(
                    new Date(comment.createdAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                  className="cursor-default text-xs text-[#8fb6ff] underline"
                >
                  {toRelativeActivityTime(comment.createdAt)}
                </span>
              </div>
              <div className="mt-1 rounded-md bg-[#2d313b] px-3 py-2 text-sm text-white/88">
                {comment.content}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-white/58">
                <span className="underline">Edit</span>
                <span>|</span>
                <span className="underline">Delete</span>
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-3">
          <Avatar name="You" size="sm" />
          <div className="text-sm text-white/74">
            <span className="font-semibold text-white/90">You</span>{" "}
            added this card to {card.list.title}
            <span
              title={format(new Date(card.createdAt), "MMM d, yyyy 'at' h:mm a")}
              className="block text-xs text-[#8fb6ff] underline"
            >
              {toRelativeActivityTime(card.createdAt)}
            </span>
          </div>
        </div>

        {card.comments.length === 0 ? (
          <p className="text-sm text-white/55">
            No comments yet. Start the discussion above.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
