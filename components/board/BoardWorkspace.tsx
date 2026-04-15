"use client";

import { format } from "date-fns";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeftRight,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  ListFilter,
  MoreHorizontal,
  Palette,
  Pin,
  Search,
  Share2,
  Star,
  Users,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchArchivedItems,
  fetchSwitchBoards,
  patchBoardBackground,
  requestArchivedAction,
} from "@/components/board/workspace/api";
import {
  BOARD_BACKGROUND_OPTIONS,
  BOARD_PREVIEW_GRADIENTS,
  DUE_DATE_FILTER_OPTIONS,
  RAIL_MAX_WIDTH,
  RAIL_MIN_WIDTH,
  resolveBoardBackgroundGradient,
} from "@/components/board/workspace/constants";
import {
  filterBoardLists,
  getActiveFilterCount,
  getFilteredTrackWidth,
} from "@/components/board/workspace/filtering";
import { resolveListTone } from "@/components/board/list-column/constants";
import { Avatar } from "@/components/ui/Avatar";
import { EditableText } from "@/components/ui/EditableText";
import { Popover } from "@/components/ui/Popover";
import { ResizableSeparator } from "@/components/ui/ResizableSeparator";
import { cn } from "@/lib/utils";
import type {
  ArchivedCardItem,
  ArchivedItemsTab,
  ArchivedListItem,
  BoardBackgroundKey,
  BoardMenuView,
  BoardWorkspaceProps,
  DueDateFilter,
  SwitchBoardItem,
} from "@/types/board-workspace";
import { ArchivedItemsDialog } from "./workspace/ArchivedItemsDialog";
import { SwitchBoardsDialog } from "./workspace/SwitchBoardsDialog";
import { KanbanBoard } from "./KanbanBoard";

export function BoardWorkspace({ board }: BoardWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>("all");
  const [railWidth, setRailWidth] = useState(296);
  const [surfaceVisibility, setSurfaceVisibility] = useState({
    inbox: true,
    board: true,
  });
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [isSwitchBoardsOpen, setIsSwitchBoardsOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState("");
  const [availableBoards, setAvailableBoards] = useState<SwitchBoardItem[]>(
    [],
  );
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [boardsError, setBoardsError] = useState<string | null>(null);
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(true);
  const [boardMenuView, setBoardMenuView] = useState<BoardMenuView>("menu");
  const [activeBoardBackground, setActiveBoardBackground] = useState(
    board.backgroundColor,
  );
  const [isChangingBackground, setIsChangingBackground] = useState(false);
  const [backgroundChangeError, setBackgroundChangeError] = useState<
    string | null
  >(null);
  const [isArchivedItemsOpen, setIsArchivedItemsOpen] = useState(false);
  const [archivedItemsTab, setArchivedItemsTab] =
    useState<ArchivedItemsTab>("lists");
  const [archivedSearch, setArchivedSearch] = useState("");
  const [archivedLists, setArchivedLists] = useState<ArchivedListItem[]>([]);
  const [archivedCards, setArchivedCards] = useState<ArchivedCardItem[]>([]);
  const [isArchivedItemsLoading, setIsArchivedItemsLoading] = useState(false);
  const [archivedItemsError, setArchivedItemsError] = useState<string | null>(
    null,
  );
  const [archivedActionKey, setArchivedActionKey] = useState<string | null>(
    null,
  );
  const [archivedActionError, setArchivedActionError] = useState<string | null>(
    null,
  );

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (!isSwitchBoardsOpen) return;

    const controller = new AbortController();

    const loadBoards = async () => {
      setBoardsLoading(true);
      setBoardsError(null);

      try {
        const boards = await fetchSwitchBoards(controller.signal);
        setAvailableBoards(boards);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setBoardsError(
          error instanceof Error
            ? error.message
            : "Failed to load boards",
        );
      } finally {
        if (!controller.signal.aborted) {
          setBoardsLoading(false);
        }
      }
    };

    loadBoards();

    return () => {
      controller.abort();
    };
  }, [isSwitchBoardsOpen]);

  useEffect(() => {
    setActiveBoardBackground(board.backgroundColor);
  }, [board.id, board.backgroundColor]);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.innerWidth < 1024) {
      setSurfaceVisibility({ inbox: false, board: true });
      return;
    }

    setSurfaceVisibility({ inbox: true, board: true });
  }, [board.id]);

  useEffect(() => {
    if (!isArchivedItemsOpen) return;

    const controller = new AbortController();

    const loadArchivedItems = async () => {
      setIsArchivedItemsLoading(true);
      setArchivedItemsError(null);

      try {
        const result = await fetchArchivedItems({
          boardId: board.id,
          tab: archivedItemsTab,
          search: archivedSearch,
          signal: controller.signal,
        });

        setArchivedLists(result.lists);
        setArchivedCards(result.cards);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setArchivedItemsError(
          error instanceof Error
            ? error.message
            : "Failed to load archived items",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsArchivedItemsLoading(false);
        }
      }
    };

    loadArchivedItems().catch(console.error);

    return () => {
      controller.abort();
    };
  }, [archivedItemsTab, archivedSearch, board.id, isArchivedItemsOpen]);

  const isCompactBottomNav = viewportWidth < 520;
  const isInboxVisible = surfaceVisibility.inbox;
  const isBoardVisible = surfaceVisibility.board;
  const isSplitView = isInboxVisible && isBoardVisible;
  const isSingleSurfaceView = !isSplitView;
  const inboxToggleLocked = !isCompactBottomNav && isInboxVisible && !isBoardVisible;
  const boardToggleLocked = !isCompactBottomNav && isBoardVisible && !isInboxVisible;

  useEffect(() => {
    if (!isCompactBottomNav) return;

    setSurfaceVisibility((current) => {
      if (current.inbox && current.board) {
        return { inbox: false, board: true };
      }

      if (!current.inbox && !current.board) {
        return { inbox: false, board: true };
      }

      return current;
    });
  }, [isCompactBottomNav]);

  const filteredBoards = useMemo(() => {
    const queryValue = boardSearch.trim().toLowerCase();
    if (!queryValue) return availableBoards;

    return availableBoards.filter((boardItem) =>
      boardItem.title.toLowerCase().includes(queryValue),
    );
  }, [availableBoards, boardSearch]);

  const recentBoards = useMemo(
    () => filteredBoards.slice(0, 6),
    [filteredBoards],
  );

  const boardCanvasBackground = useMemo(
    () => resolveBoardBackgroundGradient(activeBoardBackground),
    [activeBoardBackground],
  );

  const filteredLists = useMemo(
    () =>
      filterBoardLists({
        lists: board.lists,
        query: deferredQuery,
        selectedLabelIds,
        selectedMemberIds,
        dueDateFilter,
      }),
    [board.lists, deferredQuery, dueDateFilter, selectedLabelIds, selectedMemberIds],
  );

  const totalMatches = useMemo(
    () => filteredLists.reduce((count, list) => count + list.cards.length, 0),
    [filteredLists],
  );

  const filteredTrackWidth = useMemo(
    () => getFilteredTrackWidth(filteredLists.length),
    [filteredLists.length],
  );

  const hasActiveFilters =
    query.trim().length > 0 ||
    selectedLabelIds.length > 0 ||
    selectedMemberIds.length > 0 ||
    dueDateFilter !== "all";

  const activeFilterCount = getActiveFilterCount(
    query,
    selectedLabelIds,
    selectedMemberIds,
    dueDateFilter,
  );

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
    current: string[],
    setSelectedIds: (ids: string[]) => void,
  ) => {
    setSelectedIds(
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

  const toggleSurface = (surface: "inbox" | "board") => {
    if (isCompactBottomNav) {
      setSurfaceVisibility(
        surface === "inbox"
          ? { inbox: true, board: false }
          : { inbox: false, board: true },
      );
      return;
    }

    setSurfaceVisibility((current) => {
      const next = {
        ...current,
        [surface]: !current[surface],
      };

      if (!next.inbox && !next.board) {
        return current;
      }

      return next;
    });
  };

  const openSwitchBoardsDialog = () => {
    setBoardSearch("");
    setIsSwitchBoardsOpen(true);
  };

  const openArchivedItemsDialog = () => {
    setBoardMenuView("menu");
    setArchivedItemsTab("lists");
    setArchivedSearch("");
    setArchivedItemsError(null);
    setArchivedActionError(null);
    setIsArchivedItemsOpen(true);
  };

  const closeArchivedItemsDialog = () => {
    setIsArchivedItemsOpen(false);
    setArchivedActionKey(null);
  };

  const handleSwitchBoard = (targetBoardId: string) => {
    setIsSwitchBoardsOpen(false);

    if (targetBoardId === board.id) {
      return;
    }

    router.push(`/b/${targetBoardId}`);
  };

  const handleRestoreArchivedList = async (listId: string) => {
    const actionKey = `restore-list:${listId}`;
    setArchivedActionError(null);
    setArchivedActionKey(actionKey);

    try {
      await requestArchivedAction(`/api/lists/${listId}/restore`, {
        method: "PATCH",
      });

      setArchivedLists((current) => current.filter((list) => list.id !== listId));
      router.refresh();
    } catch (error) {
      setArchivedActionError(
        error instanceof Error ? error.message : "Failed to restore list",
      );
    } finally {
      setArchivedActionKey(null);
    }
  };

  const handleDeleteArchivedList = async (listId: string) => {
    const actionKey = `delete-list:${listId}`;
    setArchivedActionError(null);
    setArchivedActionKey(actionKey);

    try {
      await requestArchivedAction(`/api/lists/${listId}`, {
        method: "DELETE",
      });

      setArchivedLists((current) => current.filter((list) => list.id !== listId));
      router.refresh();
    } catch (error) {
      setArchivedActionError(
        error instanceof Error ? error.message : "Failed to delete list",
      );
    } finally {
      setArchivedActionKey(null);
    }
  };

  const handleRestoreArchivedCard = async (cardId: string) => {
    const actionKey = `restore-card:${cardId}`;
    setArchivedActionError(null);
    setArchivedActionKey(actionKey);

    try {
      await requestArchivedAction(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: false }),
      });

      setArchivedCards((current) => current.filter((card) => card.id !== cardId));
      router.refresh();
    } catch (error) {
      setArchivedActionError(
        error instanceof Error ? error.message : "Failed to restore card",
      );
    } finally {
      setArchivedActionKey(null);
    }
  };

  const handleDeleteArchivedCard = async (cardId: string) => {
    const actionKey = `delete-card:${cardId}`;
    setArchivedActionError(null);
    setArchivedActionKey(actionKey);

    try {
      await requestArchivedAction(`/api/cards/${cardId}`, {
        method: "DELETE",
      });

      setArchivedCards((current) => current.filter((card) => card.id !== cardId));
      router.refresh();
    } catch (error) {
      setArchivedActionError(
        error instanceof Error ? error.message : "Failed to delete card",
      );
    } finally {
      setArchivedActionKey(null);
    }
  };

  const handleOpenArchivedCard = (cardId: string) => {
    closeArchivedItemsDialog();
    openCard(cardId);
  };

  const updateBoardBackground = async (backgroundColor: BoardBackgroundKey) => {
    if (backgroundColor === activeBoardBackground || isChangingBackground) {
      return;
    }

    const previous = activeBoardBackground;

    setActiveBoardBackground(backgroundColor);
    setBackgroundChangeError(null);
    setIsChangingBackground(true);

    try {
      const nextBackground = await patchBoardBackground(board.id, backgroundColor);
      setActiveBoardBackground(nextBackground);
    } catch (error) {
      setActiveBoardBackground(previous);
      setBackgroundChangeError(
        error instanceof Error
          ? error.message
          : "Failed to update board background",
      );
    } finally {
      setIsChangingBackground(false);
    }
  };

  const handleBoardMenuTrigger = () => {
    setBoardMenuView("menu");
    setBackgroundChangeError(null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 overflow-hidden bg-[#1d2125]">
      <div
        className={cn(
          "flex h-full min-h-0 w-full",
          isSplitView
            ? "gap-3 overflow-x-auto px-4 pb-20 pt-2 [scrollbar-gutter:stable] sm:pb-4"
            : "p-0 pb-16 sm:pb-0",
        )}
      >
        {isInboxVisible ? (
          <aside
            style={isSplitView ? { width: railWidth } : { width: "100%" }}
            className={cn(
              "min-h-0 overflow-hidden bg-[linear-gradient(180deg,rgba(80,59,128,0.94),rgba(108,69,140,0.94),rgba(151,84,133,0.92))] flex flex-col",
              isSplitView ? "flex min-w-[240px] shrink-0" : "flex-1",
              isSplitView
                ? "rounded-[20px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
                : "rounded-none border-0 shadow-none",
            )}
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
        ) : null}

        {isSplitView ? <ResizableSeparator onResize={resizeRail} /> : null}

        {isBoardVisible ? (
          <section
            style={{ background: boardCanvasBackground }}
            className={cn(
              "min-w-0 flex min-h-0 flex-1 flex-col overflow-hidden",
              isSingleSurfaceView
                ? "w-full rounded-none border-0 shadow-none"
                : "min-w-[300px] rounded-[22px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm",
            )}
          >
          <div className="flex h-12 items-center gap-2 border-b border-white/10 bg-black/14 px-3 sm:h-14 sm:gap-3 sm:px-4">
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
                textClassName="text-[22px] leading-none text-white sm:text-[29px]"
                inputClassName="w-[180px] text-[22px] leading-none text-on-surface sm:w-[260px] sm:text-[29px]"
                className="rounded-md hover:bg-white/8"
              />
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white max-[520px]:hidden"
              >
                <Star className="h-4 w-4" />
              </button>
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-2">
              <Popover
                trigger={
                  <button
                    type="button"
                    className={cn(
                      "inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                      hasActiveFilters
                        ? "bg-white text-[#1d2125]"
                        : "text-white/78 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <ListFilter className="h-4 w-4" />
                    <span className="hidden md:inline">Filter</span>
                    {activeFilterCount > 0 ? (
                      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0c66e4] px-1 text-[11px] font-semibold text-white">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </button>
                }
                title="Filter"
                side="bottom"
                align="end"
                contentClassName="w-[380px] max-w-[calc(100vw-1.25rem)] border border-white/10 bg-[#2b2e38] text-white"
              >
                <div className="max-h-[68vh] space-y-5 overflow-y-auto pr-1">
                  <div>
                    <p className="text-sm font-semibold text-white/78">Keyword</p>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                      <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Enter a keyword..."
                        className="h-10 w-full rounded-md border border-white/20 bg-black/14 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/30 focus:bg-black/20"
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/56">
                      Search cards, members, labels, and more.
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white/78">Members</p>
                    <div className="mt-2 space-y-1.5">
                      {board.members.map(({ member }) => {
                        const isSelected = selectedMemberIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() =>
                              toggleSelection(
                                member.id,
                                selectedMemberIds,
                                setSelectedMemberIds,
                              )
                            }
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/8"
                          >
                            <span
                              className={cn(
                                "inline-flex h-4 w-4 items-center justify-center rounded-[3px] border",
                                isSelected
                                  ? "border-[#0c66e4] bg-[#0c66e4]"
                                  : "border-white/30 bg-transparent",
                              )}
                            >
                              {isSelected ? <Check className="h-3 w-3 text-white" /> : null}
                            </span>
                            <Avatar src={member.avatarUrl} name={member.name} size="sm" />
                            <span className="truncate text-sm text-white/88">
                              {member.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold text-white/78">
                      <CalendarDays className="h-4 w-4 text-white/56" />
                      Due date
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {DUE_DATE_FILTER_OPTIONS.map((option) => {
                        const isSelected = dueDateFilter === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() =>
                              setDueDateFilter(
                                isSelected
                                  ? "all"
                                  : (option.value as Exclude<DueDateFilter, "all">),
                              )
                            }
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/8"
                          >
                            <span
                              className={cn(
                                "inline-flex h-4 w-4 items-center justify-center rounded-[3px] border",
                                isSelected
                                  ? "border-[#0c66e4] bg-[#0c66e4]"
                                  : "border-white/30 bg-transparent",
                              )}
                            >
                              {isSelected ? <Check className="h-3 w-3 text-white" /> : null}
                            </span>
                            <span className="text-sm text-white/88">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white/78">Labels</p>
                    <div className="mt-2 space-y-1.5">
                      {board.labels.map((label) => {
                        const isSelected = selectedLabelIds.includes(label.id);

                        return (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() =>
                              toggleSelection(
                                label.id,
                                selectedLabelIds,
                                setSelectedLabelIds,
                              )
                            }
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/8"
                          >
                            <span
                              className={cn(
                                "inline-flex h-4 w-4 items-center justify-center rounded-[3px] border",
                                isSelected
                                  ? "border-[#0c66e4] bg-[#0c66e4]"
                                  : "border-white/30 bg-transparent",
                              )}
                            >
                              {isSelected ? <Check className="h-3 w-3 text-white" /> : null}
                            </span>
                            <span
                              className="h-8 min-w-0 flex-1 rounded-[4px]"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className="w-24 truncate text-xs text-white/72">
                              {label.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                  <p className="text-xs text-white/58">
                    {hasActiveFilters
                      ? `${totalMatches} matching ${totalMatches === 1 ? "card" : "cards"}`
                      : "No filters applied"}
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasActiveFilters}
                    className="inline-flex h-8 items-center rounded-md px-2.5 text-sm font-medium text-white/78 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Clear all
                  </button>
                </div>
              </Popover>

              <Popover
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/78 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Board members"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {board.members.length}
                    </span>
                  </button>
                }
                title="Board members"
                side="bottom"
                align="end"
                contentClassName="w-80"
              >
                {board.members.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    No members added to this board.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {board.members.map(({ id, role, member }) => (
                      <div
                        key={id}
                        className="flex items-center gap-3 rounded-md px-2 py-2"
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
                        <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-on-surface-variant">
                          {role}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Popover>

              <button
                type="button"
                className="hidden h-8 items-center gap-2 rounded-lg bg-white/88 px-3 text-sm font-medium text-[#1d2125] transition-colors hover:bg-white min-[900px]:inline-flex"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>

              <Popover
                trigger={
                  <button
                    type="button"
                    onClick={handleBoardMenuTrigger}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                }
                side="bottom"
                align="end"
                contentClassName="w-[352px] rounded-xl border border-white/12 bg-[#2b2e38] text-white shadow-[0_18px_40px_rgba(0,0,0,0.42)]"
              >
                {boardMenuView === "menu" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center pb-1">
                      <span className="text-sm font-semibold text-white/72">
                        Menu
                      </span>
                    </div>

                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md bg-white/7 px-3 py-2.5 text-left text-[15px] font-medium text-white/88 transition-colors hover:bg-white/12"
                    >
                      <Share2 className="h-5 w-5 text-white/72" />
                      Share board
                    </button>

                    <button
                      type="button"
                      onClick={() => setBoardMenuView("change-background")}
                      className="flex w-full items-center gap-3 rounded-md bg-white/7 px-3 py-2.5 text-left text-[15px] font-medium text-white/88 transition-colors hover:bg-white/12"
                    >
                      <span className="h-6 w-6 rounded-sm bg-[linear-gradient(135deg,#7a8cff,#d16cff)]" />
                      Change background
                    </button>

                    <button
                      type="button"
                      onClick={openArchivedItemsDialog}
                      className="flex w-full items-center gap-3 rounded-md bg-white/7 px-3 py-2.5 text-left text-[15px] font-medium text-white/88 transition-colors hover:bg-white/12"
                    >
                      <Archive className="h-5 w-5 text-white/72" />
                      Archived items
                    </button>
                  </div>
                ) : null}

                {boardMenuView === "change-background" ? (
                  <div className="space-y-4">
                    <div className="relative flex items-center justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => setBoardMenuView("menu")}
                        className="absolute left-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/12 hover:text-white"
                        aria-label="Back"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-semibold text-white/72">
                        Change background
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled
                        className="overflow-hidden rounded-lg border border-white/10 bg-white/6 text-left opacity-60"
                      >
                        <div className="h-16 bg-[linear-gradient(120deg,#4e4f58,#3f434e)]" />
                        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white/82">
                          <ImageIcon className="h-4 w-4" />
                          Photos
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBoardMenuView("colors")}
                        className="overflow-hidden rounded-lg border border-[#3a7fd9] bg-[#0c66e4]/22 text-left"
                      >
                        <div className="h-16 bg-[linear-gradient(135deg,#67458d,#96568c)]" />
                        <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white">
                          <Palette className="h-4 w-4" />
                          Colors
                        </div>
                      </button>
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-semibold text-white/84">
                        Custom
                      </p>
                      <button
                        type="button"
                        disabled
                        className="grid h-24 w-[160px] place-items-center rounded-lg border border-white/10 bg-white/6 text-3xl text-white/42"
                        title="Custom images coming soon"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : null}

                {boardMenuView === "colors" ? (
                  <div className="space-y-4">
                    <div className="relative flex items-center justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => setBoardMenuView("change-background")}
                        className="absolute left-0 inline-flex h-7 w-7 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/12 hover:text-white"
                        aria-label="Back"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <span className="text-sm font-semibold text-white/72">
                        Colors
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {BOARD_BACKGROUND_OPTIONS.map((option) => {
                        const isActive = activeBoardBackground === option.key;

                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => updateBoardBackground(option.key)}
                            disabled={isChangingBackground}
                            className={cn(
                              "group relative overflow-hidden rounded-lg border text-left transition-all",
                              isActive
                                ? "border-white/55"
                                : "border-white/12 hover:border-white/28",
                              isChangingBackground && "cursor-wait",
                            )}
                          >
                            <div
                              className="h-24 w-full"
                              style={{
                                background: resolveBoardBackgroundGradient(
                                  option.key,
                                ),
                              }}
                            />

                            <div className="absolute inset-0 flex items-end justify-between px-3 py-2">
                              <span className="text-lg" aria-hidden="true">
                                {option.emoji}
                              </span>

                              {isActive ? (
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-white">
                                  <Check className="h-4 w-4" />
                                </span>
                              ) : null}
                            </div>

                            <span className="sr-only">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {backgroundChangeError ? (
                      <p className="text-xs text-[#ff9f9f]">
                        {backgroundChangeError}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </Popover>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {hasActiveFilters ? (
              <div className="h-full overflow-x-scroll overflow-y-auto px-3 py-3 [scrollbar-gutter:stable]">
                {totalMatches > 0 ? (
                  <div
                    className="flex min-h-full min-w-full items-start gap-3 pb-2"
                    style={{ width: filteredTrackWidth }}
                  >
                    {filteredLists.map((list) => {
                      const tone = resolveListTone(list.color, list.position);

                      return (
                        <div
                          key={list.id}
                          className={cn(
                            "w-[272px] shrink-0 rounded-2xl border border-white/8 p-2 text-white shadow-[0_12px_30px_rgba(0,0,0,0.24)]",
                            tone.shell,
                          )}
                        >
                          <div className="px-2 py-2">
                            <h3 className={cn("text-sm font-semibold", tone.header)}>
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
                      );
                    })}
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
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 min-[521px]:block">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-white/10 bg-[#1d2125]/92 p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.32)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => toggleSurface("inbox")}
            disabled={inboxToggleLocked}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
              isInboxVisible
                ? "bg-[#0c66e4] text-white"
                : "text-white/72 hover:bg-white/8 hover:text-white",
              inboxToggleLocked && "cursor-not-allowed opacity-75",
            )}
          >
            <Inbox className="h-4 w-4" />
            Inbox
          </button>

          <button
            type="button"
            onClick={() => toggleSurface("board")}
            disabled={boardToggleLocked}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
              isBoardVisible
                ? "bg-[#0c66e4] text-white"
                : "text-white/72 hover:bg-white/8 hover:text-white",
              boardToggleLocked && "cursor-not-allowed opacity-75",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            Board
          </button>

          <button
            type="button"
            onClick={openSwitchBoardsDialog}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium text-white/78 transition-colors hover:bg-white/8 hover:text-white"
          >
            <ChevronsLeftRight className="h-4 w-4" />
            Switch boards
          </button>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 min-[521px]:hidden">
        <div className="pointer-events-auto border-t border-white/10 bg-[#1d2125]/96 p-2 backdrop-blur-md">
          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => toggleSurface("inbox")}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-lg transition-colors",
                isInboxVisible
                  ? "bg-[#0c66e4]/28 text-[#9ec3ff]"
                  : "text-white/72 hover:bg-white/8 hover:text-white",
              )}
              aria-label="Inbox"
            >
              <Inbox className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => toggleSurface("board")}
              className={cn(
                "inline-flex h-10 items-center justify-center rounded-lg transition-colors",
                isBoardVisible
                  ? "bg-[#0c66e4]/28 text-[#9ec3ff]"
                  : "text-white/72 hover:bg-white/8 hover:text-white",
              )}
              aria-label="Board"
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={openSwitchBoardsDialog}
              className="inline-flex h-10 items-center justify-center rounded-lg text-white/72 transition-colors hover:bg-white/8 hover:text-white"
              aria-label="Switch boards"
            >
              <ChevronsLeftRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <ArchivedItemsDialog
        isOpen={isArchivedItemsOpen}
        onClose={closeArchivedItemsDialog}
        tab={archivedItemsTab}
        onTabChange={setArchivedItemsTab}
        search={archivedSearch}
        onSearchChange={setArchivedSearch}
        itemsError={archivedItemsError}
        actionError={archivedActionError}
        isLoading={isArchivedItemsLoading}
        archivedLists={archivedLists}
        archivedCards={archivedCards}
        actionKey={archivedActionKey}
        onRestoreList={(listId) => {
          void handleRestoreArchivedList(listId);
        }}
        onDeleteList={(listId) => {
          void handleDeleteArchivedList(listId);
        }}
        onRestoreCard={(cardId) => {
          void handleRestoreArchivedCard(cardId);
        }}
        onDeleteCard={(cardId) => {
          void handleDeleteArchivedCard(cardId);
        }}
        onOpenCard={handleOpenArchivedCard}
      />

      <SwitchBoardsDialog
        isOpen={isSwitchBoardsOpen}
        onClose={() => setIsSwitchBoardsOpen(false)}
        boardSearch={boardSearch}
        onBoardSearchChange={setBoardSearch}
        boardsLoading={boardsLoading}
        boardsError={boardsError}
        recentBoards={recentBoards}
        filteredBoards={filteredBoards}
        currentBoardId={board.id}
        isWorkspaceExpanded={isWorkspaceExpanded}
        onToggleWorkspaceExpanded={() =>
          setIsWorkspaceExpanded((current) => !current)
        }
        onSwitchBoard={handleSwitchBoard}
        previewGradients={BOARD_PREVIEW_GRADIENTS}
      />
    </div>
  );
}
