"use client";

import {
  closestCenter,
  closestCorners,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  createOrCopyList,
  patchBoardTitle,
  persistCardMove,
  persistCardsReorder,
} from "@/components/board/kanban-board/api";
import { createCardInList } from "@/components/board/list-column/api";
import { useHorizontalDragScroll } from "@/components/board/hooks/useHorizontalDragScroll";
import { EditableText } from "@/components/ui/EditableText";
import {
  reorderListsAction,
} from "@/lib/actions/board.actions";
import type { BoardCard, BoardList, KanbanBoardProps } from "@/types/kanban-board";
import { KanbanCard } from "../card/KanbanCard";
import { ListColumn } from "./ListColumn";

function createOptimisticId(prefix: "temp-list" | "temp-card") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function KanbanBoard({
  board: initialBoard,
  hideHeader = false,
}: KanbanBoardProps) {
  const [board, setBoard] = useState(initialBoard);
  const boardRef = useRef(initialBoard);
  const [activeCard, setActiveCard] = useState<BoardCard | null>(null);
  const [activeList, setActiveList] = useState<BoardList | null>(null);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [copySourceListId, setCopySourceListId] = useState<string | null>(null);
  const newListInputRef = useRef<HTMLInputElement>(null);
  const boardCanvasRef = useHorizontalDragScroll<HTMLDivElement>();

  const handleAddList = async () => {
    const title = newListTitle.trim();
    const sourceListId = copySourceListId;

    setNewListTitle("");
    setIsAddingList(false);
    setCopySourceListId(null);

    if (!title) {
      setIsAddingList(false);
      setCopySourceListId(null);
      return;
    }

    const optimisticListId = createOptimisticId("temp-list");
    const optimisticList: BoardList = {
      id: optimisticListId,
      boardId: board.id,
      title,
      color: null,
      position: boardRef.current.lists.length,
      cards: [],
    };

    const requestedPosition = boardRef.current.lists.length * 1024;

    setBoard((current) => {
      const nextBoard = {
        ...current,
        lists: [...current.lists, optimisticList],
      };
      boardRef.current = nextBoard;
      return nextBoard;
    });

    try {
      const nextList = await createOrCopyList({
        boardId: board.id,
        title,
        position: requestedPosition,
        copySourceListId: sourceListId,
      });

      setBoard((current) => {
        const nextBoard = {
          ...current,
          lists: current.lists.map((list) =>
            list.id === optimisticListId ? nextList : list,
          ),
        };
        boardRef.current = nextBoard;
        return nextBoard;
      });
    } catch (e) {
      console.error(e);

      setBoard((current) => {
        const nextBoard = {
          ...current,
          lists: current.lists.filter((list) => list.id !== optimisticListId),
        };
        boardRef.current = nextBoard;
        return nextBoard;
      });
    }
  };

  const handleCreateCard = async (listId: string, title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const sourceList = boardRef.current.lists.find((list) => list.id === listId);
    if (!sourceList) return;

    const optimisticCardId = createOptimisticId("temp-card");
    const optimisticCard: BoardCard = {
      id: optimisticCardId,
      listId,
      title: trimmedTitle,
      description: null,
      position: sourceList.cards.length,
      dueDate: null,
      isArchived: false,
      coverColor: null,
      labels: [],
      members: [],
      _count: {
        checklistItems: 0,
        comments: 0,
      },
      checklistDone: 0,
    };

    const requestedPosition = sourceList.cards.length * 1024;

    setBoard((current) => {
      const nextBoard = {
        ...current,
        lists: current.lists.map((list) =>
          list.id === listId
            ? {
                ...list,
                cards: [...list.cards, optimisticCard],
              }
            : list,
        ),
      };
      boardRef.current = nextBoard;
      return nextBoard;
    });

    try {
      const createdCard = await createCardInList(
        listId,
        trimmedTitle,
        requestedPosition,
      );

      const normalizedCard: BoardCard = {
        id: createdCard.id,
        listId: createdCard.listId ?? listId,
        title: createdCard.title,
        description: createdCard.description ?? null,
        position: createdCard.position ?? sourceList.cards.length,
        dueDate: createdCard.dueDate ?? null,
        isArchived: createdCard.isArchived ?? false,
        coverColor: createdCard.coverColor ?? null,
        coverImageUrl: createdCard.coverImageUrl ?? null,
        labels: createdCard.labels ?? [],
        members: createdCard.members ?? [],
        _count: {
          checklistItems: createdCard._count?.checklistItems ?? 0,
          comments: createdCard._count?.comments ?? 0,
        },
        checklistDone: createdCard.checklistDone ?? 0,
      };

      setBoard((current) => {
        const nextBoard = {
          ...current,
          lists: current.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  cards: list.cards.map((card) =>
                    card.id === optimisticCardId ? normalizedCard : card,
                  ),
                }
              : list,
          ),
        };
        boardRef.current = nextBoard;
        return nextBoard;
      });
    } catch (error) {
      console.error(error);

      setBoard((current) => {
        const nextBoard = {
          ...current,
          lists: current.lists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  cards: list.cards.filter((card) => card.id !== optimisticCardId),
                }
              : list,
          ),
        };
        boardRef.current = nextBoard;
        return nextBoard;
      });
    }
  };

  const requestCopyList = (listId: string, title: string) => {
    setCopySourceListId(listId);
    setNewListTitle(title);
    setIsAddingList(true);
  };

  const patchListInBoard = (
    listId: string,
    patch: { title?: string; color?: string | null; isArchived?: boolean },
  ) => {
    if (patch.isArchived) {
      setBoard((current) => ({
        ...current,
        lists: current.lists.filter((list) => list.id !== listId),
      }));
      return;
    }

    setBoard((current) => ({
      ...current,
      lists: current.lists.map((list) =>
        list.id === listId ? { ...list, ...patch } : list,
      ),
    }));
  };

  const listsId = useMemo(
    () => board.lists.map((list) => list.id),
    [board.lists],
  );

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Keep local board state in sync with fresh server data from router.refresh().
    boardRef.current = initialBoard;
    setBoard(initialBoard);
  }, [initialBoard]);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    if (isAddingList) {
      newListInputRef.current?.focus();
    }
  }, [isAddingList]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const boardTrackWidth = useMemo(() => {
    // Track width: N lists + 1 add-list column + gaps between columns.
    return 272 * (board.lists.length + 1) + 12 * board.lists.length;
  }, [board.lists.length]);

  const collisionDetectionStrategy: CollisionDetection = (args) => {
    if (args.active.data.current?.type === "List") {
      return closestCenter({
        ...args,
        droppableContainers: args.droppableContainers.filter(
          (container) => container.data.current?.type === "List",
        ),
      });
    }

    return closestCorners(args);
  };

  if (!isMounted) {
    return <div className="flex-1 w-full bg-transparent" />; // Wait for client
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Board Header */}
      {hideHeader ? null : (
        <div className="h-[52px] bg-black/20 backdrop-blur-sm shadow-sm flex items-center px-4 shrink-0 justify-between text-white z-10 relative">
          <EditableText
            value={board.title}
            onChange={(newVal) => {
              setBoard({ ...board, title: newVal });
              patchBoardTitle(board.id, newVal).catch(console.error);
            }}
            as="h1"
            textClassName="text-[20px] text-white"
            inputClassName="text-[20px] text-on-surface w-[300px]"
            className="hover:bg-white/20 dark:hover:bg-white/20 -ml-1 rounded-md"
          />
        </div>
      )}

      {/* Board Canvas */}
      <div
        ref={boardCanvasRef}
        className="flex-1 min-h-0 w-full overflow-x-scroll overflow-y-hidden p-3 [scrollbar-gutter:stable]"
        style={{
          background:
            board.backgroundColor === "snow"
              ? "var(--color-surface-container-highest)"
              : "transparent",
        }}
      >
        <DndContext
          id="board-sortable-context"
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div
            className="flex min-h-full min-w-full items-start gap-3 pb-2"
            style={{ width: boardTrackWidth }}
          >
            <SortableContext
              items={listsId}
              strategy={horizontalListSortingStrategy}
            >
              {board.lists.map((list) => (
                <ListColumn
                  key={list.id}
                  list={list}
                  onRequestCopyList={requestCopyList}
                  onCreateCard={handleCreateCard}
                  onListPatched={patchListInBoard}
                />
              ))}
            </SortableContext>

            {/* Add New List Button */}
            <div data-pan-block="true" className="w-[272px] shrink-0">
              {isAddingList ? (
                <div className="bg-surface-container-low rounded-lg p-2 shadow-sm flex flex-col gap-2">
                  <input
                    ref={newListInputRef}
                    className="w-full text-sm border-2 border-primary rounded-sm p-1.5 outline-none bg-surface text-on-surface"
                    placeholder="Enter list title..."
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddList();
                      if (e.key === "Escape") {
                        setIsAddingList(false);
                        setNewListTitle("");
                        setCopySourceListId(null);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddList}
                      className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors"
                    >
                      Add list
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingList(false);
                        setNewListTitle("");
                        setCopySourceListId(null);
                      }}
                      className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-2 py-1.5 rounded-sm transition-colors text-sm font-medium"
                    >
                      X
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setCopySourceListId(null);
                    setNewListTitle("");
                    setIsAddingList(true);
                  }}
                  className="w-full bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium rounded-lg p-3 text-left flex items-center gap-2 backdrop-blur-sm"
                >
                  <span className="text-lg leading-none">+</span> Add another
                  list
                </button>
              )}
            </div>
          </div>

          {isMounted
            ? createPortal(
                <DragOverlay adjustScale={false}>
                  {activeList ? <ListColumn list={activeList} isOverlay /> : null}
                  {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
                </DragOverlay>,
                document.body,
              )
            : null}

        </DndContext>
      </div>
    </div>
  );

  function onDragStart(event: DragStartEvent) {
    const { active } = event;
    const data = active.data.current;

    if (data?.type === "List") {
      setActiveList(data.list);
      return;
    }

    if (data?.type === "Card") {
      setActiveCard(data.card);
      return;
    }
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event;

    if (!over) return;
    if (active.data.current?.type !== "List") return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    setBoard((prevBoard) => {
      const activeListIndex = prevBoard.lists.findIndex(
        (list) => list.id === activeId,
      );
      const overListIndex = prevBoard.lists.findIndex(
        (list) => list.id === overId,
      );

      if (
        activeListIndex < 0 ||
        overListIndex < 0 ||
        activeListIndex === overListIndex
      ) {
        return prevBoard;
      }

      return {
        ...prevBoard,
        lists: arrayMove(prevBoard.lists, activeListIndex, overListIndex),
      };
    });
  }

  async function onDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setActiveList(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const currentBoard = boardRef.current;

    const isListDrag = active.data.current?.type === "List";

    if (isListDrag) {
      const activeListIndex = currentBoard.lists.findIndex(
        (list) => list.id === activeId,
      );
      const overListIndex = currentBoard.lists.findIndex(
        (list) => list.id === overId,
      );

      if (activeListIndex < 0 || overListIndex < 0) return;

      const newBoardLists =
        activeListIndex === overListIndex
          ? currentBoard.lists
          : arrayMove(currentBoard.lists, activeListIndex, overListIndex);

      if (activeListIndex !== overListIndex) {
        const updatedBoard = { ...currentBoard, lists: newBoardLists };
        boardRef.current = updatedBoard;
        setBoard(updatedBoard);
      }

      reorderListsAction(
        currentBoard.id,
        newBoardLists.map((list) => list.id),
      );
      return;
    }

    if (active.data.current?.type !== "Card") return;

    const sourceListIndex = currentBoard.lists.findIndex((list) =>
      list.cards.some((card) => card.id === activeId),
    );
    if (sourceListIndex < 0) return;

    const sourceCardIndex = currentBoard.lists[sourceListIndex].cards.findIndex(
      (card) => card.id === activeId,
    );
    if (sourceCardIndex < 0) return;

    const overType = over.data.current?.type;
    const destinationListId =
      overType === "List"
        ? overId
        : (over.data.current?.sortable?.containerId as string | undefined);

    if (!destinationListId) return;

    const destinationListIndex = currentBoard.lists.findIndex(
      (list) => list.id === destinationListId,
    );
    if (destinationListIndex < 0) return;

    const isSameListMove = sourceListIndex === destinationListIndex;

    if (isSameListMove) {
      const listCards = currentBoard.lists[sourceListIndex].cards;
      const overCardIndex =
        overType === "Card"
          ? listCards.findIndex((card) => card.id === overId)
          : listCards.length - 1;

      if (overCardIndex < 0 || sourceCardIndex === overCardIndex) {
        return;
      }

      const newBoardLists = currentBoard.lists.map((list, index) =>
        index === sourceListIndex
          ? {
              ...list,
              cards: arrayMove(list.cards, sourceCardIndex, overCardIndex),
            }
          : { ...list, cards: [...list.cards] },
      );

      const updatedBoard = { ...currentBoard, lists: newBoardLists };
      boardRef.current = updatedBoard;
      setBoard(updatedBoard);

      try {
        await persistCardsReorder(
          newBoardLists[sourceListIndex].id,
          newBoardLists[sourceListIndex].cards.map((card) => card.id),
        );
      } catch (error) {
        console.error("Failed to persist same-list card reorder", error);
        boardRef.current = currentBoard;
        setBoard(currentBoard);
      }
      return;
    }

    const newBoardLists = currentBoard.lists.map((list) => ({
      ...list,
      cards: [...list.cards],
    }));

    const [movedCard] = newBoardLists[sourceListIndex].cards.splice(
      sourceCardIndex,
      1,
    );

    let destinationCardIndex =
      overType === "Card"
        ? newBoardLists[destinationListIndex].cards.findIndex(
            (card) => card.id === overId,
          )
        : newBoardLists[destinationListIndex].cards.length;

    if (destinationCardIndex < 0) {
      destinationCardIndex = newBoardLists[destinationListIndex].cards.length;
    }

    if (overType === "Card") {
      const isBelowOverItem =
        !!active.rect.current.translated &&
        active.rect.current.translated.top >
          over.rect.top + over.rect.height / 2;

      if (isBelowOverItem) {
        destinationCardIndex += 1;
      }
    }

    movedCard.listId = destinationListId;
    newBoardLists[destinationListIndex].cards.splice(
      destinationCardIndex,
      0,
      movedCard,
    );

    const updatedBoard = { ...currentBoard, lists: newBoardLists };
    boardRef.current = updatedBoard;
    setBoard(updatedBoard);

    const sourceListId = newBoardLists[sourceListIndex].id;
    const destinationListIdFinal = newBoardLists[destinationListIndex].id;

    try {
      await persistCardMove(activeId, destinationListIdFinal, destinationCardIndex);

      await persistCardsReorder(
        sourceListId,
        newBoardLists[sourceListIndex].cards.map((card) => card.id),
      );
      await persistCardsReorder(
        destinationListIdFinal,
        newBoardLists[destinationListIndex].cards.map((card) => card.id),
      );
    } catch (error) {
      console.error("Failed to persist cross-list card move", error);
      boardRef.current = currentBoard;
      setBoard(currentBoard);
    }
  }
}
