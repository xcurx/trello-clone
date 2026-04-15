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
import { EditableText } from "@/components/ui/EditableText";
import {
  reorderListsAction,
} from "@/lib/actions/board.actions";
import { KanbanCard } from "../card/KanbanCard";
import { ListColumn } from "./ListColumn";

type BoardCard = {
  id: string;
  listId: string;
  title: string;
  description: string | null;
  position: number;
  dueDate: Date | string | null;
  isArchived: boolean;
  coverColor: string | null;
  labels: Array<{
    id: string;
    label: {
      id: string;
      title: string;
      color: string;
    };
  }>;
  members: Array<{
    id: string;
    member: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }>;
  _count: {
    checklistItems: number;
    comments: number;
  };
  checklistDone?: number;
  checklistItems?: Array<{ id: string }>;
};

type BoardList = {
  id: string;
  boardId: string;
  title: string;
  position: number;
  cards: BoardCard[];
};

type BoardState = {
  id: string;
  title: string;
  backgroundColor: string;
  lists: BoardList[];
};

interface KanbanBoardProps {
  board: BoardState;
  hideHeader?: boolean;
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
  const newListInputRef = useRef<HTMLInputElement>(null);

  const handleAddList = async () => {
    if (!newListTitle.trim()) {
      setIsAddingList(false);
      return;
    }
    const title = newListTitle.trim();
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          boardId: board.id,
          position: board.lists.length * 1024,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBoard({
          ...board,
          lists: [...board.lists, { ...data.data, cards: [] }],
        });
      }
    } catch (e) {
      console.error(e);
    }
    setNewListTitle("");
    setIsAddingList(false);
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
    setBoard((current) =>
      current.id === initialBoard.id ? current : initialBoard,
    );
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

  const patchJson = async (url: string, payload: unknown) => {
    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data && typeof data === "object" && "error" in data
          ? String((data as { error?: unknown }).error)
          : "Request failed";
      throw new Error(message);
    }
  };

  const persistCardsReorder = async (listId: string, orderedIds: string[]) => {
    await patchJson("/api/cards/reorder", { listId, orderedIds });
  };

  const persistCardMove = async (
    cardId: string,
    targetListId: string,
    position: number,
  ) => {
    await patchJson(`/api/cards/${cardId}/move`, { targetListId, position });
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
              fetch(`/api/boards/${board.id}`, {
                method: "PATCH",
                body: JSON.stringify({ title: newVal }),
              }).catch(console.error);
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
                <ListColumn key={list.id} list={list} />
              ))}
            </SortableContext>

            {/* Add New List Button */}
            <div className="w-[272px] shrink-0">
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
                  onClick={() => setIsAddingList(true)}
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
