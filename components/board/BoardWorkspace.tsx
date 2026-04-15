"use client";

import { format, isAfter, isBefore, isToday } from "date-fns";
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeftRight,
  Filter,
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
  RotateCcw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  type Dispatch,
  type SetStateAction,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
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

type SwitchBoardItem = {
  id: string;
  title: string;
  backgroundColor: string;
  _count?: {
    lists?: number;
    members?: number;
  };
};

type ArchivedListItem = {
  id: string;
  title: string;
  updatedAt: string;
  cardsCount: number;
};

type ArchivedCardItem = {
  id: string;
  title: string;
  updatedAt: string;
  listId: string;
  listTitle: string;
  commentsCount: number;
};

type ArchivedItemsTab = "lists" | "cards";

type BoardMenuView = "menu" | "change-background" | "colors";

type BoardBackgroundKey =
  | "ocean"
  | "sunset"
  | "forest"
  | "lavender"
  | "midnight"
  | "sky"
  | "berry"
  | "slate"
  | "snow";

type BoardBackgroundOption = {
  key: BoardBackgroundKey;
  emoji: string;
  label: string;
};

interface BoardWorkspaceProps {
  board: WorkspaceBoard;
}

type DueDateFilter = "all" | "overdue" | "today" | "week" | "none";

const RAIL_MIN_WIDTH = 240;
const RAIL_MAX_WIDTH = 420;

const BOARD_PREVIEW_GRADIENTS: Record<string, string> = {
  ocean: "linear-gradient(135deg, #0079bf, #00629d)",
  sunset: "linear-gradient(135deg, #eb5a46, #ff9f1a)",
  forest: "linear-gradient(135deg, #61bd4f, #0a8043)",
  lavender: "linear-gradient(135deg, #c377e0, #7c5cbf)",
  midnight: "linear-gradient(135deg, #344563, #091e42)",
  sky: "linear-gradient(135deg, #00c2e0, #0079bf)",
  berry: "linear-gradient(135deg, #ff78cb, #c377e0)",
  slate: "linear-gradient(135deg, #838c91, #505f79)",
  snow: "linear-gradient(135deg, #f8f9fd, #e1e2e6)",
};

const BOARD_CANVAS_GRADIENTS: Record<BoardBackgroundKey, string> = {
  ocean: "linear-gradient(180deg, #5a437f 0%, #754992 52%, #965687 100%)",
  sunset: "linear-gradient(180deg, #5b3b31 0%, #824b4a 52%, #9e5f72 100%)",
  forest: "linear-gradient(180deg, #1f4f47 0%, #2d5f58 52%, #4a6d64 100%)",
  lavender:
    "linear-gradient(180deg, #67458d 0%, #7d4e99 48%, #96568c 100%)",
  midnight:
    "linear-gradient(180deg, #253252 0%, #354565 52%, #4d5d78 100%)",
  sky: "linear-gradient(180deg, #204a67 0%, #355f84 52%, #536b98 100%)",
  berry: "linear-gradient(180deg, #693760 0%, #874b77 52%, #a76184 100%)",
  slate: "linear-gradient(180deg, #38434e 0%, #495565 52%, #5e6278 100%)",
  snow: "linear-gradient(180deg, #40465a 0%, #525a72 52%, #6e6784 100%)",
};

const BOARD_BACKGROUND_OPTIONS: BoardBackgroundOption[] = [
  { key: "midnight", emoji: "🪐", label: "Midnight" },
  { key: "sky", emoji: "❄️", label: "Sky" },
  { key: "ocean", emoji: "🌊", label: "Ocean" },
  { key: "berry", emoji: "🔮", label: "Berry" },
  { key: "lavender", emoji: "🌈", label: "Lavender" },
  { key: "sunset", emoji: "🍑", label: "Sunset" },
  { key: "snow", emoji: "🌸", label: "Snow" },
  { key: "forest", emoji: "🌍", label: "Forest" },
  { key: "slate", emoji: "👽", label: "Slate" },
];

const resolveBoardBackgroundGradient = (backgroundColor: string) => {
  const key = backgroundColor as BoardBackgroundKey;
  return BOARD_CANVAS_GRADIENTS[key] ?? BOARD_CANVAS_GRADIENTS.ocean;
};

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
        const response = await fetch("/api/boards", {
          signal: controller.signal,
          cache: "no-store",
        });

        const payload = (await response.json()) as {
          success?: boolean;
          data?: SwitchBoardItem[];
          error?: string;
        };

        if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
          throw new Error(payload.error ?? "Failed to load boards");
        }

        setAvailableBoards(payload.data);
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
    if (!isArchivedItemsOpen) return;

    const controller = new AbortController();

    const loadArchivedItems = async () => {
      setIsArchivedItemsLoading(true);
      setArchivedItemsError(null);

      try {
        const query = new URLSearchParams();
        query.set("type", archivedItemsTab);

        const trimmedQuery = archivedSearch.trim();
        if (trimmedQuery) {
          query.set("q", trimmedQuery);
        }

        const response = await fetch(
          `/api/boards/${board.id}/archived?${query.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        const payload = (await response.json()) as {
          success?: boolean;
          data?: {
            lists?: ArchivedListItem[];
            cards?: ArchivedCardItem[];
          };
          error?: string;
        };

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? "Failed to load archived items");
        }

        setArchivedLists(payload.data?.lists ?? []);
        setArchivedCards(payload.data?.cards ?? []);
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

  const isInboxVisible = surfaceVisibility.inbox;
  const isBoardVisible = surfaceVisibility.board;
  const isSplitView = isInboxVisible && isBoardVisible;
  const isSingleSurfaceView = !isSplitView;
  const inboxToggleLocked = isInboxVisible && !isBoardVisible;
  const boardToggleLocked = isBoardVisible && !isInboxVisible;

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

  const filteredTrackWidth = useMemo(() => {
    if (filteredLists.length === 0) return 0;
    return 272 * filteredLists.length + 12 * (filteredLists.length - 1);
  }, [filteredLists.length]);

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

  const toggleSurface = (surface: "inbox" | "board") => {
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

  const requestArchivedAction = async (url: string, init?: RequestInit) => {
    const response = await fetch(url, init);
    const payload = (await response.json()) as {
      success?: boolean;
      error?: string;
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error ?? "Request failed");
    }
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
      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgroundColor }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        data?: { backgroundColor?: string };
        error?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Failed to update board background");
      }

      setActiveBoardBackground(payload.data?.backgroundColor ?? backgroundColor);
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
          isSplitView ? "gap-3 px-4 pb-4 pt-2" : "p-0",
        )}
      >
        {isInboxVisible ? (
          <aside
            style={isSplitView ? { width: railWidth } : { width: "100%" }}
            className={cn(
              "min-h-0 overflow-hidden bg-[linear-gradient(180deg,rgba(80,59,128,0.94),rgba(108,69,140,0.94),rgba(151,84,133,0.92))] flex flex-col",
              isSplitView ? "hidden shrink-0 lg:flex" : "flex-1",
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
                : "rounded-[22px] border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-sm",
            )}
          >
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

              <Popover
                trigger={
                  <button
                    type="button"
                    className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/78 transition-colors hover:bg-white/10 hover:text-white"
                    aria-label="Board members"
                  >
                    <Users className="h-4 w-4" />
                    <span className="hidden lg:inline">
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
                className="inline-flex h-8 items-center gap-2 rounded-lg bg-white/88 px-3 text-sm font-medium text-[#1d2125] transition-colors hover:bg-white"
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
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 lg:block">
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

      <Dialog
        isOpen={isArchivedItemsOpen}
        onClose={closeArchivedItemsDialog}
        className="max-w-[760px] border border-white/10 bg-[#2b2e38] text-white"
      >
        <div className="px-6 pb-6 pt-4">
          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onClick={closeArchivedItemsDialog}
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
              value={archivedSearch}
              onChange={(event) => setArchivedSearch(event.target.value)}
              placeholder="Search"
              className="h-10 flex-1 rounded-md border border-white/25 bg-[#272b35] px-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#8fb8ff]"
            />

            <div className="rounded-md bg-white/7 p-1">
              <button
                type="button"
                onClick={() => setArchivedItemsTab("lists")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  archivedItemsTab === "lists"
                    ? "bg-white text-[#1f2328]"
                    : "text-white/76 hover:bg-white/10 hover:text-white",
                )}
              >
                Lists
              </button>
              <button
                type="button"
                onClick={() => setArchivedItemsTab("cards")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  archivedItemsTab === "cards"
                    ? "bg-white text-[#1f2328]"
                    : "text-white/76 hover:bg-white/10 hover:text-white",
                )}
              >
                Cards
              </button>
            </div>
          </div>

          {archivedItemsError ? (
            <p className="mt-3 text-sm text-[#ffb4b4]">{archivedItemsError}</p>
          ) : null}

          {archivedActionError ? (
            <p className="mt-2 text-xs text-[#ffb4b4]">{archivedActionError}</p>
          ) : null}

          <div className="mt-4 max-h-[360px] overflow-y-auto rounded-lg border border-white/8 bg-black/10">
            {isArchivedItemsLoading ? (
              <div className="px-4 py-5 text-sm text-white/65">Loading archived items...</div>
            ) : archivedItemsTab === "lists" ? (
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
                            {archivedList.cardsCount} cards · archived {format(new Date(archivedList.updatedAt), "MMM d")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void handleRestoreArchivedList(archivedList.id);
                            }}
                            disabled={archivedActionKey === restoreKey}
                            className="inline-flex h-8 items-center gap-1 rounded-md bg-white/8 px-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-65"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void handleDeleteArchivedList(archivedList.id);
                            }}
                            disabled={archivedActionKey === deleteKey}
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
                <div className="px-4 py-5 text-sm text-white/65">No archived lists found.</div>
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
                        onClick={() => handleOpenArchivedCard(archivedCard.id)}
                        className="min-w-0 text-left"
                      >
                        <p className="truncate text-sm font-medium text-white/90 hover:text-white">
                          {archivedCard.title}
                        </p>
                        <p className="text-xs text-white/55">
                          {archivedCard.listTitle} · {archivedCard.commentsCount} comments · archived {format(new Date(archivedCard.updatedAt), "MMM d")}
                        </p>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            void handleRestoreArchivedCard(archivedCard.id);
                          }}
                          disabled={archivedActionKey === restoreKey}
                          className="inline-flex h-8 items-center gap-1 rounded-md bg-white/8 px-3 text-sm font-medium text-white/86 transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-65"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void handleDeleteArchivedCard(archivedCard.id);
                          }}
                          disabled={archivedActionKey === deleteKey}
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
              <div className="px-4 py-5 text-sm text-white/65">No archived cards found.</div>
            )}
          </div>
        </div>
      </Dialog>

      <Dialog
        isOpen={isSwitchBoardsOpen}
        onClose={() => setIsSwitchBoardsOpen(false)}
        className="max-w-[640px] border border-white/10 bg-[#2b2e38] text-white"
      >
        <div className="px-6 pb-6 pt-10">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
              <input
                type="text"
                value={boardSearch}
                onChange={(event) => setBoardSearch(event.target.value)}
                placeholder="Search your boards"
                className="h-10 w-full rounded-md border border-[#6ba4ff] bg-[#242833] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/50 focus:border-[#8ab6ff]"
              />
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/8 text-white/70 transition-colors hover:bg-white/14 hover:text-white"
              aria-label="List view"
            >
              <ListFilter className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/8 text-white/70 transition-colors hover:bg-white/14 hover:text-white"
              aria-label="Pinned boards"
            >
              <Pin className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-md border border-[#6ba4ff] bg-[#0c66e4]/22 px-2.5 py-1 text-sm font-medium text-[#8ab6ff]">
              All
            </span>
            <span className="rounded-md bg-white/8 px-2.5 py-1 text-sm font-medium text-white/82">
              Trello Workspace
            </span>
          </div>

          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-white/76">Recent</p>

            {boardsLoading ? (
              <p className="text-sm text-white/58">Loading boards...</p>
            ) : boardsError ? (
              <p className="text-sm text-[#ff9f9f]">{boardsError}</p>
            ) : recentBoards.length === 0 ? (
              <p className="text-sm text-white/58">No boards found.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {recentBoards.map((boardItem) => (
                  <button
                    key={boardItem.id}
                    type="button"
                    onClick={() => handleSwitchBoard(boardItem.id)}
                    className={cn(
                      "overflow-hidden rounded-lg border border-white/10 text-left transition-all hover:border-white/30",
                      boardItem.id === board.id && "border-[#6ba4ff]",
                    )}
                  >
                    <div
                      className="h-16 w-full"
                      style={{
                        background:
                          BOARD_PREVIEW_GRADIENTS[boardItem.backgroundColor] ??
                          BOARD_PREVIEW_GRADIENTS.ocean,
                      }}
                    />
                    <div className="bg-black/28 px-3 py-2">
                      <p className="truncate text-sm font-medium text-white">
                        {boardItem.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => setIsWorkspaceExpanded((current) => !current)}
              className="inline-flex items-center gap-2 text-left text-lg font-semibold text-white/84 transition-colors hover:text-white"
            >
              {isWorkspaceExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Trello Workspace
            </button>

            {isWorkspaceExpanded ? (
              <div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">
                {filteredBoards.map((boardItem) => (
                  <button
                    key={`${boardItem.id}-row`}
                    type="button"
                    onClick={() => handleSwitchBoard(boardItem.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors hover:bg-white/8",
                      boardItem.id === board.id && "bg-[#0c66e4]/20 text-[#9ac2ff]",
                    )}
                  >
                    <span className="truncate text-sm font-medium">
                      {boardItem.title}
                    </span>
                    <span className="text-xs text-white/56">
                      {boardItem._count?.lists ?? 0} lists
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
