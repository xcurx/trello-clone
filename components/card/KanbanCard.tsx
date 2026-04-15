"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, CheckSquare, Clock } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export interface KanbanCardData {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  coverColor?: string | null;
  checklistDone?: number;
  checklistItems?: unknown[];
  labels?: Array<{
    id: string;
    label: {
      id: string;
      title: string;
      color: string;
    };
  }>;
  members?: Array<{
    id: string;
    member: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }>;
  _count?: {
    checklistItems?: number;
    comments?: number;
  };
}

interface KanbanCardProps {
  card: KanbanCardData;
  isOverlay?: boolean;
}

export function KanbanCard({ card, isOverlay = false }: KanbanCardProps) {
  if (isOverlay) {
    return (
      <div className="rotate-2 rounded-xl border border-white/6 bg-[#2b3036] p-3 text-left shadow-card-drag opacity-95">
        <CardContent card={card} />
      </div>
    );
  }

  return <SortableKanbanCard card={card} />;
}

function SortableKanbanCard({ card }: { card: KanbanCardData }) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "Card",
      card,
    },
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-[92px] rounded-xl border-2 border-dashed border-white/18 bg-white/8"
      />
    );
  }

  const handleOpenCard = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("card", card.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleOpenCard}
      className={cn(
        "group cursor-pointer rounded-xl border border-white/6 bg-[#2b3036] p-3 text-left shadow-[0_8px_18px_rgba(0,0,0,0.22)] transition-all hover:border-white/10 hover:bg-[#323840] hover:shadow-[0_14px_26px_rgba(0,0,0,0.28)] active:cursor-grabbing",
      )}
    >
      <CardContent card={card} />
    </button>
  );
}

function CardContent({ card }: { card: KanbanCardData }) {
  const labels = card.labels?.map((entry) => entry.label) || [];
  const checklistTotal =
    card.checklistItems?.length ?? card._count?.checklistItems ?? 0;
  const checklistDone = card.checklistDone ?? 0;
  const members = card.members?.map((entry) => entry.member) || [];

  return (
    <>
      {card.coverColor ? (
        <div
          className="mb-2 h-1.5 w-full rounded-full"
          style={{ backgroundColor: card.coverColor }}
        />
      ) : null}

      {labels.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label.id}
              title={label.title}
              className="h-2 w-10 rounded-xs"
              style={{ backgroundColor: label.color }}
            />
          ))}
        </div>
      ) : null}

      <h4 className="mb-3 whitespace-pre-wrap break-words text-left text-[14px] font-medium leading-[1.35] text-white/92">
        {card.title}
      </h4>

      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-white/52">
          {card.description ? <AlignLeft className="h-3.5 w-3.5" /> : null}
          {card.dueDate ? <Clock className="h-3.5 w-3.5" /> : null}
          {checklistTotal > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/16 px-1.5 py-1 text-[11px] font-medium text-white/72">
              <CheckSquare className="h-3.5 w-3.5" />
              {checklistDone}/{checklistTotal}
            </span>
          ) : null}
        </div>

        {members.length > 0 ? (
          <div className="flex items-center">
            {members.slice(0, 3).map((member) => (
              <Avatar
                key={member.id}
                src={member.avatarUrl}
                name={member.name}
                size="sm"
                className="-ml-1 border border-[#2b3036] first:ml-0"
              />
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
