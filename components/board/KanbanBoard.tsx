"use client";

import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";

import { ListColumn } from "./ListColumn";
import { KanbanCard } from "../card/KanbanCard";
// import type { Board, List, Card } from "@/types";
import { reorderListsAction, reorderCardsAction } from "@/lib/actions/board.actions";
import { EditableText } from "@/components/ui/EditableText";

interface KanbanBoardProps {
  board: any; // Using any for UI prototype to handle nested Prisma types easily
}

export function KanbanBoard({ board: initialBoard }: KanbanBoardProps) {
  const [board, setBoard] = useState(initialBoard);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [activeList, setActiveList] = useState<any | null>(null);

  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const handleAddList = async () => {
    if (!newListTitle.trim()) {
      setIsAddingList(false);
      return;
    }
    const title = newListTitle.trim();
    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, boardId: board.id, position: board.lists.length * 1024 })
      });
      const data = await res.json();
      if (data.success) {
        setBoard({ ...board, lists: [...board.lists, { ...data.data, cards: [] }] });
      }
    } catch (e) {
      console.error(e);
    }
    setNewListTitle("");
    setIsAddingList(false);
  };

  const listsId = useMemo(
    () => board.lists.map((l: any) => l.id),
    [board.lists]
  );

  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!isMounted) {
    return <div className="flex-1 w-full bg-transparent" />; // Wait for client
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Board Header */}
      <div className="h-[52px] bg-black/20 backdrop-blur-sm shadow-sm flex items-center px-4 shrink-0 justify-between text-white z-10 relative">
        <EditableText 
          value={board.title}
          onChange={(newVal) => {
            // Optimistic update
            setBoard({ ...board, title: newVal });
            // API Action call (we could create updateBoardAction in board.actions.ts)
            fetch(`/api/boards/${board.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ title: newVal })
            }).catch(console.error);
          }}
          as="h1"
          textClassName="text-[20px] text-white"
          inputClassName="text-[20px] text-on-surface w-[300px]"
          className="hover:bg-white/20 dark:hover:bg-white/20 -ml-1 rounded-md"
        />
      </div>

      {/* Board Canvas */}
      <div
        className="flex-1 w-full overflow-x-auto overflow-y-hidden p-3"
        style={{
          background: board.backgroundColor === "snow" 
            ? "var(--color-surface-container-highest)" 
            : "transparent",
        }}
      >
        <DndContext
          id="board-sortable-context"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex items-start gap-3 h-full">
            <SortableContext items={listsId} strategy={horizontalListSortingStrategy}>
              {board.lists.map((list: any) => (
                <ListColumn key={list.id} list={list} />
              ))}
            </SortableContext>

            {/* Add New List Button */}
      <div className="w-[272px] shrink-0">
        {isAddingList ? (
          <div className="bg-surface-container-low rounded-lg p-2 shadow-sm flex flex-col gap-2">
            <input 
              autoFocus
              className="w-full text-sm border-2 border-primary rounded-sm p-1.5 outline-none bg-surface text-on-surface"
              placeholder="Enter list title..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddList();
                if (e.key === 'Escape') {
                  setIsAddingList(false);
                  setNewListTitle("");
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button onClick={handleAddList} className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors">
                Add list
              </button>
              <button onClick={() => { setIsAddingList(false); setNewListTitle(""); }} className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-2 py-1.5 rounded-sm transition-colors text-sm font-medium">
                X
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingList(true)}
            className="w-full bg-white/20 hover:bg-white/30 transition-colors text-white text-sm font-medium rounded-lg p-3 text-left flex items-center gap-2 backdrop-blur-sm"
          >
            <span className="text-lg leading-none">+</span> Add another list
          </button>
        )}
      </div>
          </div>

          <DragOverlay>
            {activeList ? <ListColumn list={activeList} isOverlay /> : null}
            {activeCard ? <KanbanCard card={activeCard} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );

  function onDragStart(event: DragStartEvent) {
    const { active } = event;
    const { id } = active;
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

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === "Card";
    const isOverACard = over.data.current?.type === "Card";
    const isOverAList = over.data.current?.type === "List";

    if (!isActiveACard) return;

    // Moving a card
    setBoard((prevBoard: any) => {
      const activeList = prevBoard.lists.find((l: any) => l.id === active.data.current?.sortable.containerId);
      const overList = isOverAList 
        ? prevBoard.lists.find((l: any) => l.id === overId)
        : prevBoard.lists.find((l: any) => l.id === over.data.current?.sortable.containerId);
      
      if (!activeList || !overList) return prevBoard;

      const activeListIndex = prevBoard.lists.findIndex((l: any) => l.id === activeList.id);
      const overListIndex = prevBoard.lists.findIndex((l: any) => l.id === overList.id);

      const activeCardIndex = activeList.cards.findIndex((c: any) => c.id === activeId);

      // Same list drop is handled in DragEnd for sorting. DragOver just needs cross-list.
      if (activeList.id !== overList.id) {
        let overCardIndex = overList.cards.length;
        if (isOverACard) {
          overCardIndex = overList.cards.findIndex((c: any) => c.id === overId);
          const isBelowOverItem =
            over &&
            active.rect.current.translated &&
            active.rect.current.translated.top >
              over.rect.top + over.rect.height;

          const modifier = isBelowOverItem ? 1 : 0;
          overCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overList.cards.length + 1;
        }

        const newLists = [...prevBoard.lists];
        const sourceList = { ...newLists[activeListIndex], cards: [...newLists[activeListIndex].cards] };
        const destList = { ...newLists[overListIndex], cards: [...newLists[overListIndex].cards] };

        const [movedCard] = sourceList.cards.splice(activeCardIndex, 1);
        movedCard.listId = destList.id; // Update list relation locally
        
        destList.cards.splice(overCardIndex, 0, movedCard);

        newLists[activeListIndex] = sourceList;
        newLists[overListIndex] = destList;

        return { ...prevBoard, lists: newLists };
      }

      return prevBoard;
    });
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    setActiveList(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    let targetAction: (() => void) | null = null;
    let newBoardLists = [...board.lists];

    const isListDrag = active.data.current?.type === "List";
      
    if (isListDrag) {
      const activeListIndex = board.lists.findIndex((l: any) => l.id === activeId);
      const overListIndex = board.lists.findIndex((l: any) => l.id === overId);

      newBoardLists = arrayMove(board.lists, activeListIndex, overListIndex);
      targetAction = () => reorderListsAction(board.id, newBoardLists.map((l: any) => l.id));
    } else {
      const activeListIndex = board.lists.findIndex((l: any) => 
        l.cards.some((c: any) => c.id === activeId)
      );
      
      if (activeListIndex !== -1) {
        const activeList = board.lists[activeListIndex];
        const activeCardIndex = activeList.cards.findIndex((c: any) => c.id === activeId);
        let overCardIndex = activeList.cards.findIndex((c: any) => c.id === overId);
        
        if (overCardIndex === -1) {
            // If overId is a list instead of a card, it won't be found in cards.
            overCardIndex = activeList.cards.length - 1;
        }

        const newList = {
          ...activeList,
          cards: arrayMove(activeList.cards, activeCardIndex, overCardIndex)
        };

        newBoardLists[activeListIndex] = newList;
        targetAction = () => reorderCardsAction(newList.id, newList.cards.map((c: any) => c.id));
      }
    }

    // Apply strict UI update first
    setBoard({ ...board, lists: newBoardLists });
    
    // Execute backend sync outside React render phase
    if (targetAction) {
      targetAction();
    }
  }
}
