"use client";

import { format, isAfter, isBefore, isToday } from "date-fns";
import {
  CalendarDays,
  CheckSquare,
  Filter,
  Search,
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

export function BoardWorkspace({ board }: BoardWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");

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
      .filter(
        (list) =>
          list.cards.length > 0 ||
          (!normalizedQuery &&
            selectedLabelIds.length === 0 &&
            selectedMemberIds.length === 0 &&
            dueDateFilter === "all"),
      );
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

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-3 pt-3">
        <div className="rounded-xl bg-black/14 px-3 py-2 text-white backdrop-blur-md">
          <div className="overflow-x-auto overflow-y-hidden">
            <div className="flex w-max min-w-full items-center gap-4 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <EditableText
                  value={board.title}
                  onChange={(newVal) => {
                    fetch(`/api/boards/${board.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({ title: newVal }),
                    }).catch(console.error);
                  }}
                  as="h1"
                  textClassName="text-lg text-white"
                  inputClassName="text-lg text-on-surface w-[260px]"
                  className="min-w-[180px] rounded-md hover:bg-white/12"
                />

                <div className="relative w-[280px] shrink-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/65" />
                  <input
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search cards by title..."
                    className="h-8 w-full rounded-md bg-white/14 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-white/65 focus:bg-white/22"
                  />
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2 rounded-lg bg-black/12 px-1.5 py-1">
                {hasActiveFilters ? (
                  <span className="rounded-md bg-black/18 px-2 py-1 text-xs font-medium text-white/88">
                    {totalMatches} {totalMatches === 1 ? "match" : "matches"}
                  </span>
                ) : null}

                <Popover
                  trigger={
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                        selectedLabelIds.length > 0
                          ? "bg-white text-on-surface"
                          : "bg-white/14 text-white hover:bg-white/22",
                      )}
                    >
                      <Filter className="h-4 w-4" />
                      Labels
                      {selectedLabelIds.length > 0 ? (
                        <span className="rounded-sm bg-black/8 px-1.5 py-0.5 text-[11px] font-semibold text-on-surface">
                          {selectedLabelIds.length}
                        </span>
                      ) : null}
                    </button>
                  }
                  title="Filter by labels"
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
                          {isSelected ? (
                            <span className="text-xs font-semibold text-primary">
                              On
                            </span>
                          ) : null}
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
                        "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                        selectedMemberIds.length > 0
                          ? "bg-white text-on-surface"
                          : "bg-white/14 text-white hover:bg-white/22",
                      )}
                    >
                      <Users className="h-4 w-4" />
                      Members
                      {selectedMemberIds.length > 0 ? (
                        <span className="rounded-sm bg-black/8 px-1.5 py-0.5 text-[11px] font-semibold text-on-surface">
                          {selectedMemberIds.length}
                        </span>
                      ) : null}
                    </button>
                  }
                  title="Filter by members"
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
                          {isSelected ? (
                            <span className="text-xs font-semibold text-primary">
                              On
                            </span>
                          ) : null}
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
                        "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                        dueDateFilter !== "all"
                          ? "bg-white text-on-surface"
                          : "bg-white/14 text-white hover:bg-white/22",
                      )}
                    >
                      <CalendarDays className="h-4 w-4" />
                      {dueDateFilter === "all" ? "Dates" : "Date filter"}
                    </button>
                  }
                  title="Filter by due date"
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
                    className="inline-flex h-8 shrink-0 items-center gap-2 rounded-md bg-black/18 px-3 text-sm font-medium text-white transition-colors hover:bg-black/26"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex-1 overflow-auto px-3 py-3">
          {totalMatches > 0 ? (
            <div className="flex min-h-full items-start gap-3">
              {filteredLists.map((list) => (
                <div
                  key={list.id}
                  className="w-[272px] shrink-0 rounded-lg bg-surface-container-low p-2 text-on-surface shadow-sm"
                >
                  <div className="px-2 py-2">
                    <h3 className="text-sm font-semibold">{list.title}</h3>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {list.cards.length} matching{" "}
                      {list.cards.length === 1 ? "card" : "cards"}
                    </p>
                  </div>

                  <div className="space-y-2 px-1 pb-1">
                    {list.cards.map((card) => {
                      const dueDate = card.dueDate
                        ? new Date(card.dueDate)
                        : null;
                      const checklistTotal = card._count.checklistItems ?? 0;
                      const checklistDone = card.checklistDone ?? 0;

                      return (
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => openCard(card.id)}
                          className="w-full rounded-md bg-surface-container-lowest p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
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

                          <h4 className="text-sm font-medium text-on-surface">
                            {card.title}
                          </h4>

                          <div className="mt-3 flex items-end justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                              {dueDate ? (
                                <span className="rounded-sm bg-surface-container px-2 py-1">
                                  {format(dueDate, "MMM d")}
                                </span>
                              ) : null}
                              {checklistTotal > 0 ? (
                                <span className="inline-flex items-center gap-1 rounded-sm bg-surface-container px-2 py-1">
                                  <CheckSquare className="h-3.5 w-3.5" />
                                  {checklistDone}/{checklistTotal}
                                </span>
                              ) : null}
                            </div>

                            {card.members.length > 0 ? (
                              <div className="flex">
                                {card.members
                                  .slice(0, 3)
                                  .map(({ id, member }) => (
                                    <Avatar
                                      key={id}
                                      src={member.avatarUrl}
                                      name={member.name}
                                      size="sm"
                                      className="-ml-1 border border-white/70 first:ml-0"
                                    />
                                  ))}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="rounded-2xl bg-black/16 px-6 py-8 text-center text-white backdrop-blur-md">
                <p className="text-lg font-semibold">
                  No cards match these filters
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Try a broader title search or clear one of the active filters.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <KanbanBoard board={board} hideHeader />
      )}
    </div>
  );
}
