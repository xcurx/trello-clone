"use client";

import { useMemo, useState } from "react";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal } from "lucide-react";
import { KanbanCard } from "../card/KanbanCard";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/ui/EditableText";
import { useRouter } from "next/navigation";

interface ListColumnProps {
  list: any; // Type inference relaxed for props prototyping
  isOverlay?: boolean;
}

export function ListColumn({ list, isOverlay = false }: ListColumnProps) {
  const cardsIds = useMemo(() => list.cards.map((c: any) => c.id), [list.cards]);

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  const router = useRouter();

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) {
      setIsAddingCard(false);
      return;
    }
    const title = newCardTitle.trim();
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, listId: list.id, position: list.cards.length * 1024 })
      });
      const data = await res.json();
      if (data.success) {
        list.cards.push(data.data); 
        router.refresh(); // Sync server state efficiently
      }
    } catch (e) {
      console.error(e);
    }
    setNewCardTitle("");
    setIsAddingCard(false);
  };

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: "List",
      list,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-[272px] shrink-0 h-[150px] bg-white/20 border-2 border-dashed border-white/50 rounded-lg opacity-40 backdrop-blur-sm"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "w-[272px] shrink-0 bg-surface-container-low rounded-lg flex flex-col max-h-full pb-2 shadow-sm text-on-surface",
        isOverlay && "opacity-90 shadow-2xl rotate-2"
      )}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="p-3 pb-1 flex justify-between items-center cursor-grab active:cursor-grabbing hover:bg-black/5 transition-colors rounded-t-lg group"
      >
        <EditableText 
          value={list.title} 
          onChange={(newVal) => {
             fetch(`/api/lists/${list.id}`, { method: 'PATCH', body: JSON.stringify({ title: newVal }) }).catch(console.error);
             list.title = newVal; // optimistic fallback
          }}
          as="h3" 
          textClassName="text-sm cursor-text"
          inputClassName="text-sm"
          className="flex-1 -ml-1"
        />
        <button className="text-on-surface-variant hover:bg-surface-container-high p-1.5 rounded-sm transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Area scrollable */}
      <div className="px-2 pb-1 overflow-y-auto overflow-x-hidden flex flex-col gap-2 flex-auto custom-scrollbar">
        <SortableContext items={cardsIds} strategy={verticalListSortingStrategy}>
          {list.cards.map((card: any) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pt-1 pb-1">
        {isAddingCard ? (
          <div className="flex flex-col gap-2 p-1">
            <textarea 
              autoFocus
              className="w-full text-sm border-2 border-primary rounded-sm p-1.5 outline-none bg-surface text-on-surface custom-scrollbar resize-y h-[70px]"
              placeholder="Enter a title for this card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard();
                }
                if (e.key === 'Escape') {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleAddCard} className="bg-primary hover:bg-primary/90 text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors">
                Add card
              </button>
              <button onClick={() => { setIsAddingCard(false); setNewCardTitle(""); }} className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-2 py-1.5 rounded-sm transition-colors text-sm font-medium">
                X
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingCard(true)}
            className="flex items-center gap-2 text-on-surface-variant text-sm font-medium hover:bg-black/5 hover:text-on-surface w-full p-2 rounded-md transition-colors text-left"
          >
            <span className="text-lg leading-none">+</span> Add a card
          </button>
        )}
      </div>
    </div>
  );
}
