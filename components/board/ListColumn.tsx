"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { EditableText } from "@/components/ui/EditableText";
import { cn } from "@/lib/utils";
import { KanbanCard, type KanbanCardData } from "../card/KanbanCard";

interface ListColumnProps {
  list: {
    id: string;
    title: string;
    position: number;
    cards: KanbanCardData[];
  };
  isOverlay?: boolean;
}

const LIST_TONES = [
  {
    shell: "bg-[#4f3a72]/84 border-white/8",
    header: "bg-[#5f4786]/72 text-white",
  },
  {
    shell: "bg-[#59470f]/84 border-white/8",
    header: "bg-[#6d5714]/74 text-[#ffec8b]",
  },
  {
    shell: "bg-[#1d5a4c]/84 border-white/8",
    header: "bg-[#256d5c]/72 text-[#b8f2df]",
  },
  {
    shell: "bg-[#171915]/92 border-white/8",
    header: "bg-[#20231d]/78 text-white",
  },
];

export function ListColumn({ list, isOverlay = false }: ListColumnProps) {
  const cardsIds = useMemo(
    () => list.cards.map((card) => card.id),
    [list.cards],
  );
  const tone = LIST_TONES[list.position % LIST_TONES.length];

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) {
      setIsAddingCard(false);
      return;
    }

    const title = newCardTitle.trim();

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          listId: list.id,
          position: list.cards.length * 1024,
        }),
      });
      const data = await response.json();
      if (data.success) {
        list.cards.push(data.data);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
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
        className="h-[180px] w-[272px] shrink-0 rounded-2xl border-2 border-dashed border-white/24 bg-black/18 opacity-50"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex max-h-full w-[272px] shrink-0 flex-col overflow-hidden rounded-2xl border text-white shadow-[0_14px_34px_rgba(0,0,0,0.24)] backdrop-blur-sm",
        tone.shell,
        isOverlay && "rotate-2 opacity-90 shadow-card-drag",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "group flex cursor-grab items-center justify-between border-b border-white/8 px-3 py-3 active:cursor-grabbing",
          tone.header,
        )}
      >
        <EditableText
          value={list.title}
          onChange={(newValue) => {
            fetch(`/api/lists/${list.id}`, {
              method: "PATCH",
              body: JSON.stringify({ title: newValue }),
            }).catch(console.error);
            list.title = newValue;
          }}
          as="h3"
          textClassName="text-base font-semibold cursor-text"
          inputClassName="text-base text-on-surface"
          className="min-w-0 flex-1 rounded-md bg-transparent px-0 hover:bg-white/6"
        />

        <button
          type="button"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 pt-2">
        <SortableContext
          items={cardsIds}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <KanbanCard key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      <div className="px-2 pb-2 pt-1">
        {isAddingCard ? (
          <div className="space-y-2 rounded-xl bg-black/16 p-2">
            <textarea
              ref={textareaRef}
              className="h-[74px] w-full resize-none rounded-xl border border-white/10 bg-[#1f2328] p-3 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="Enter a title for this card..."
              value={newCardTitle}
              onChange={(event) => setNewCardTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleAddCard();
                }
                if (event.key === "Escape") {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                }
              }}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddCard}
                className="inline-flex h-8 items-center rounded-md bg-[#579dff] px-3 text-sm font-medium text-[#082145] transition-colors hover:bg-[#85b8ff]"
              >
                Add card
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle("");
                }}
                className="inline-flex h-8 items-center rounded-md px-2 text-sm font-medium text-white/68 transition-colors hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsAddingCard(true);
              requestAnimationFrame(() => textareaRef.current?.focus());
            }}
            className="flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-medium text-white/72 transition-colors hover:bg-black/14 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
}
