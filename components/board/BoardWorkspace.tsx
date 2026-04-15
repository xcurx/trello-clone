"use client";

import { format, isAfter, isBefore, isToday } from "date-fns";
import {
  CalendarDays,
  Filter,
  Inbox,
  MoreHorizontal,
  Search,
  Share2,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type Dispatch,
  type SetStateAction,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import { Avatar } from "@/components/ui/Avatar";
import { EditableText } from "@/components/ui/EditableText";
import { Popover } from "@/components/ui/Popover";
import { ResizableSeparator } from "@/components/ui/ResizableSeparator";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "./KanbanBoard";

type WorkspaceLabel = {
  id: string;
  title: string;
  color: string;
};

type WorkspaceMember = {
  id: string;
  role: string;
  member: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

type WorkspaceCard = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: string | Date | null;
  isArchived: boolean;
  coverColor: string | null;
  labels: Array<{
    id: string;
    label: WorkspaceLabel;
  }>;
  members: Array<{
    id: string;
    member: WorkspaceMember["member"];
  }>;
  _count: {
    checklistItems: number;
    comments: number;
  };
  checklistDone?: number;
};

type WorkspaceList = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: WorkspaceCard[];
};

type WorkspaceBoard = {
  id: string;
  title: string;
  backgroundColor: string;
  labels: WorkspaceLabel[];
  members: WorkspaceMember[];
  lists: WorkspaceList[];
};

interface BoardWorkspaceProps {
  board: WorkspaceBoard;
}

type DueDateFilter = "all" | "overdue" | "today" | "week" | "none";

const RAIL_MIN_WIDTH = 240;
const RAIL_MAX_WIDTH = 420;

export function BoardWorkspace({ board }: BoardWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");
  const [railWidth, setRailWidth] = useState(296);

  const deferredQuery = useDeferredValue(query);

  const filteredLists = useMemo(() => {
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return board.lists
      .map((list) => ({
        ...list,
        cards: list.cards.filter((card) => {
          const matchesQuery = normalizedQuery
            ? card.title.toLowerCase().includes(normalizedQuery)
            : true;

          const matchesLabels =
            selectedLabelIds.length === 0
              ? true
              : selectedLabelIds.every((labelId) =>
                  card.labels.some((entry) => entry.label.id === labelId),
                );

          const matchesMembers =
            selectedMemberIds.length === 0
              ? true
              : selectedMemberIds.every((memberId) =>
                  card.members.some((entry) => entry.member.id === memberId),
                );

          const dueDate = card.dueDate ? new Date(card.dueDate) : null;
          const matchesDueDate =
            dueDateFilter === "all" ||
            (dueDateFilter === "none" && !dueDate) ||
            (dueDateFilter === "overdue" &&
              !!dueDate &&
              isBefore(dueDate, now) &&
              !isToday(dueDate)) ||
            (dueDateFilter === "today" && !!dueDate && isToday(dueDate)) ||
            (dueDateFilter === "week" &&
              !!dueDate &&
              (isToday(dueDate) ||
                (isAfter(dueDate, now) && isBefore(dueDate, weekFromNow))));

          return (
            matchesQuery && matchesLabels && matchesMembers && matchesDueDate
          );
        }),
      }))
      .filter((list) => list.cards.length > 0);
  }, [
    board.lists,
    deferredQuery,
    dueDateFilter,
    selectedLabelIds,
    selectedMemberIds,
  ]);

  const totalMatches = useMemo(
    () => filteredLists.reduce((count, list) => count + list.cards.length, 0),
    [filteredLists],
  );

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedLabelIds.length > 0 ||
    selectedMemberIds.length > 0 ||
    dueDateFilter !== "all";

  const railCards = useMemo(
    () => board.lists.flatMap((list) => list.cards).slice(0, 6),
    [board.lists],
  );

  const openCard = (cardId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("card", cardId);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedLabelIds([]);
    setSelectedMemberIds([]);
    setDueDateFilter("all");
  };

  const toggleSelection = (
    id: string,
    setSelectedIds: Dispatch<SetStateAction<string[]>>,
  ) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  };

  const resizeRail = (deltaX: number) => {
    setRailWidth((current) =>
      Math.min(RAIL_MAX_WIDTH, Math.max(RAIL_MIN_WIDTH, current + deltaX)),
    );
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-[#1d2125]">
      <div className="flex h-full gap-3 px-4 pb-4 pt-2">
        <aside
          style={{ width: railWidth }}
          className="hidden shrink-0 overflow-hidden rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(80,59,128,0.94),rgba(108,69,140,0.94),rgba(151,84,133,0.92))] shadow-[0_20px_50px_rgba(0,0,0,0.28)] lg:flex lg:flex-col"
        >
          <div className="flex h-14 items-center justify-between border-b border-white/10 bg-black/12 px-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-4 w-4 text-white/78" />
              <span className="text-[15px] font-semibold text-white">
                Inbox
              </span>
            </div>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-3">
            <button
              type="button"
              className="flex h-9 w-full items-center rounded-lg bg-[#25282d] px-3 text-left text-sm text-white/55 transition-colors hover:bg-[#2c3137] hover:text-white/72"
            >
              Add a card
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-3">
            {railCards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => openCard(card.id)}
                className="block w-full rounded-xl bg-[#24282d]/90 p-3 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="line-clamp-2 text-sm font-medium text-white/92">
                    {card.title}
                  </span>
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/8 text-[11px] font-semibold text-white/76">
                    {index + 1}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/58">
                  {card.description ||
                    "Open this card to continue the workflow."}
                </p>
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-3 rounded-2xl bg-black/16 px-3 py-3">
              <div className="h-10 w-10 rounded-2xl bg-[linear-gradient(135deg,#7a8cff,#d16cff)]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  Workspace color
                </p>
                <p className="truncate text-xs text-white/62">
                  Gradient theme active
                </p>
              </div>
            </div>
          </div>
        </aside>

        <ResizableSeparator onResize={resizeRail} />

        <section className="min-w-0 flex-1 overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(111,73,140,0.36)_0%,rgba(118,76,140,0.2)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm">
          <div className="flex h-14 items-center gap-3 border-b border-white/10 bg-black/14 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <EditableText
                value={board.title}
                onChange={(newVal) => {
                  fetch(`/api/boards/${board.id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ title: newVal }),
                  }).catch(console.error);
                }}
                as="h1"
                textClassName="text-[29px] text-white"
                inputClassName="text-[29px] text-on-surface w-[260px]"
                className="rounded-md hover:bg-white/8"
              />
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Star className="h-4 w-4" />
              </button>
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <div className="relative hidden w-[260px] shrink-0 xl:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search cards..."
                  className="h-8 w-full rounded-md border border-white/10 bg-black/16 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/45 focus:border-white/20 focus:bg-black/24"
                />
              </div>

              <div className="flex items-center gap-1 rounded-xl bg-black/12 p-1">
                <Popover
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                        selectedLabelIds.length > 0
                          ? "bg-white text-[#1d2125]"
                          : "text-white/78 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      Labels
                    </button>
                  }
                  title="Labels"
                  side="bottom"
                  align="end"
                >
                  <div className="space-y-2">
                    {board.labels.map((label) => {
                      const isSelected = selectedLabelIds.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() =>
                            toggleSelection(label.id, setSelectedLabelIds)
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-container",
                            isSelected && "bg-primary-fixed",
                          )}
                        >
                          <span
                            className="h-8 w-12 shrink-0 rounded-sm"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-on-surface">
                            {label.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Popover>

                <Popover
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                        selectedMemberIds.length > 0
                          ? "bg-white text-[#1d2125]"
                          : "text-white/78 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Users className="h-4 w-4" />
                      Members
                    </button>
                  }
                  title="Members"
                  side="bottom"
                  align="end"
                >
                  <div className="space-y-2">
                    {board.members.map(({ member }) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() =>
                            toggleSelection(member.id, setSelectedMemberIds)
                          }
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-container",
                            isSelected && "bg-primary-fixed",
                          )}
                        >
                          <Avatar
                            src={member.avatarUrl}
                            name={member.name}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-on-surface">
                              {member.name}
                            </p>
                            <p className="truncate text-xs text-on-surface-variant">
                              {member.email}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Popover>

                <Popover
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                        dueDateFilter !== "all"
                          ? "bg-white text-[#1d2125]"
                          : "text-white/78 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <CalendarDays className="h-4 w-4" />
                      Dates
                    </button>
                  }
                  title="Due date"
                  side="bottom"
                  align="end"
                >
                  <div className="space-y-2">
                    {[
                      { value: "all", label: "Any due date" },
                      { value: "overdue", label: "Overdue" },
                      { value: "today", label: "Due today" },
                      { value: "week", label: "Due this week" },
                      { value: "none", label: "No due date" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setDueDateFilter(option.value as DueDateFilter)
                        }
                        className={cn(
                          "block w-full rounded-md px-2 py-2 text-left text-sm font-medium text-on-surface transition-colors hover:bg-surface-container",
                          dueDateFilter === option.value &&
                            "bg-primary-fixed text-primary",
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Popover>

                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/78 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                ) : null}
              </div>

              {hasActiveFilters ? (
                <span className="hidden rounded-md bg-white/12 px-2.5 py-1 text-xs font-medium text-white/82 xl:inline-flex">
                  {totalMatches} {totalMatches === 1 ? "card" : "cards"}
                </span>
              ) : null}

              <div className="hidden items-center gap-1 md:flex">
                {board.members.slice(0, 3).map(({ id, member }) => (
                  <Avatar
                    key={id}
                    src={member.avatarUrl}
                    name={member.name}
                    size="sm"
                    className="-ml-1 border border-[#1d2125] first:ml-0"
                  />
                ))}
              </div>

              <button
                type="button"
                className="inline-flex h-8 items-center gap-2 rounded-lg bg-white/88 px-3 text-sm font-medium text-[#1d2125] transition-colors hover:bg-white"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/72 transition-colors hover:bg-white/10 hover:text-white"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {hasActiveFilters ? (
              <div className="h-full overflow-auto px-3 py-3">
                {totalMatches > 0 ? (
                  <div className="flex min-h-full items-start gap-3">
                    {filteredLists.map((list) => (
                      <div
                        key={list.id}
                        className="w-[272px] shrink-0 rounded-2xl border border-white/8 bg-[#181c1f]/92 p-2 text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)]"
                      >
                        <div className="px-2 py-2">
                          <h3 className="text-sm font-semibold text-white/92">
                            {list.title}
                          </h3>
                          <p className="mt-1 text-xs text-white/48">
                            {list.cards.length} matching cards
                          </p>
                        </div>

                        <div className="space-y-2 px-1 pb-1">
                          {list.cards.map((card) => {
                            const dueDate = card.dueDate
                              ? new Date(card.dueDate)
                              : null;

                            return (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => openCard(card.id)}
                                className="w-full rounded-xl border border-white/6 bg-[#24282d] p-3 text-left text-white transition-colors hover:bg-[#2a2f35]"
                              >
                                {card.labels.length > 0 ? (
                                  <div className="mb-2 flex flex-wrap gap-1">
                                    {card.labels.map(({ id, label }) => (
                                      <span
                                        key={id}
                                        className="h-2 w-10 rounded-xs"
                                        style={{ backgroundColor: label.color }}
                                      />
                                    ))}
                                  </div>
                                ) : null}

                                <h4 className="text-sm font-medium text-white/90">
                                  {card.title}
                                </h4>

                                {dueDate ? (
                                  <p className="mt-2 text-xs text-white/52">
                                    Due {format(dueDate, "MMM d")}
                                  </p>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="rounded-2xl border border-white/10 bg-black/14 px-6 py-8 text-center text-white backdrop-blur-md">
                      <p className="text-lg font-semibold">
                        No cards match these filters
                      </p>
                      <p className="mt-2 text-sm text-white/62">
                        Try a broader search or reset one of the filters.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <KanbanBoard board={board} hideHeader />
            )}
          </div>
        </section>
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-white/10 bg-[#1d2125]/92 p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.32)] backdrop-blur-md">
          {[
            { label: "Inbox", active: false, icon: Inbox },
            { label: "Planner", active: false, icon: CalendarDays },
            { label: "Board", active: true, icon: Sparkles },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
                item.active
                  ? "bg-[#0c66e4] text-white"
                  : "text-white/72 hover:bg-white/8 hover:text-white",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
