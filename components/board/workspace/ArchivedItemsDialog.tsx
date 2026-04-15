"use client";

import { format } from "date-fns";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import type {
  ArchivedCardItem,
  ArchivedItemsTab,
  ArchivedListItem,
} from "@/types/board-workspace";

interface ArchivedItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tab: ArchivedItemsTab;
  onTabChange: (tab: ArchivedItemsTab) => void;
  search: string;
  onSearchChange: (value: string) => void;
  itemsError: string | null;
  actionError: string | null;
  isLoading: boolean;
  archivedLists: ArchivedListItem[];
  archivedCards: ArchivedCardItem[];
  actionKey: string | null;
  onRestoreList: (listId: string) => void;
  onDeleteList: (listId: string) => void;
  onRestoreCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onOpenCard: (cardId: string) => void;
}

export function ArchivedItemsDialog({
  isOpen,
  onClose,
  tab,
  onTabChange,
  search,
  onSearchChange,
  itemsError,
  actionError,
  isLoading,
  archivedLists,
  archivedCards,
  actionKey,
  onRestoreList,
  onDeleteList,
  onRestoreCard,
  onDeleteCard,
  onOpenCard,
}: ArchivedItemsDialogProps) {
  const nextTab = tab === "lists" ? "cards" : "lists";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[760px] border border-white/10 bg-[#2b2e38] text-white"
    >
      <div className="px-6 pb-6 pt-4">
        <div className="relative flex items-center justify-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-5 inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="text-lg font-semibold text-white/86">Archived items</h3>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            className="h-10 flex-1 rounded-md border border-white/25 bg-[#272b35] px-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#8fb8ff]"
          />

          <button
            type="button"
            onClick={() => onTabChange(nextTab)}
            className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-md bg-white/9 px-3 text-sm font-medium text-white/88 transition-colors hover:bg-white/14"
            aria-label={`Switch to ${nextTab}`}
          >
            {tab === "lists" ? "Show cards" : "Show lists"}
          </button>
        </div>

        {itemsError ? (
          <p className="mt-3 text-sm text-[#ffb4b4]">{itemsError}</p>
        ) : null}

        {actionError ? (
          <p className="mt-2 text-xs text-[#ffb4b4]">{actionError}</p>
        ) : null}

        <div className="mt-4 max-h-[360px] overflow-y-auto rounded-lg border border-white/8 bg-black/10">
          {isLoading ? (
            <div className="px-4 py-5 text-sm text-white/65">
              Loading archived items...
            </div>
          ) : tab === "lists" ? (
            archivedLists.length > 0 ? (
              <div className="divide-y divide-white/10">
                {archivedLists.map((archivedList) => {
                  const restoreKey = `restore-list:${archivedList.id}`;
                  const deleteKey = `delete-list:${archivedList.id}`;

                  return (
                    <div
                      key={archivedList.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/90">
                          {archivedList.title}
                        </p>
                        <p className="text-xs text-white/55">
                          {archivedList.cardsCount} cards · archived {" "}
                          {format(new Date(archivedList.updatedAt), "MMM d")}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRestoreList(archivedList.id)}
                          disabled={actionKey === restoreKey}
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-white/8 px-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteList(archivedList.id)}
                          disabled={actionKey === deleteKey}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/8 text-white/86 transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-65"
                          aria-label="Delete archived list"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-5 text-sm text-white/65">
                No archived lists found.
              </div>
            )
          ) : archivedCards.length > 0 ? (
            <div className="divide-y divide-white/10">
              {archivedCards.map((archivedCard) => {
                const restoreKey = `restore-card:${archivedCard.id}`;
                const deleteKey = `delete-card:${archivedCard.id}`;

                return (
                  <div
                    key={archivedCard.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <button
                      type="button"
                      onClick={() => onOpenCard(archivedCard.id)}
                      className="min-w-0 text-left"
                    >
                      <p className="truncate text-sm font-medium text-white/90 hover:text-white">
                        {archivedCard.title}
                      </p>
                      <p className="text-xs text-white/55">
                        {archivedCard.listTitle} · {archivedCard.commentsCount} comments · archived{" "}
                        {format(new Date(archivedCard.updatedAt), "MMM d")}
                      </p>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onRestoreCard(archivedCard.id)}
                        disabled={actionKey === restoreKey}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-white/8 px-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-65"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCard(archivedCard.id)}
                        disabled={actionKey === deleteKey}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/8 text-white/86 transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-65"
                        aria-label="Delete archived card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-white/65">
              No archived cards found.
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
}
