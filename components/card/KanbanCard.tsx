"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, CheckSquare, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { format } from "date-fns";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface KanbanCardProps {
  card: any;
  isOverlay?: boolean;
}

export function KanbanCard({ card, isOverlay }: KanbanCardProps) {
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
        className="h-[60px] bg-primary-fixed/50 border-2 border-dashed border-primary/50 rounded-md ring-2 ring-inset ring-primary/20 backdrop-blur-sm"
      />
    );
  }

  // Label chips logic
  const labels = card.labels?.map((cl: any) => cl.label) || [];
  const checklistTotal = card.checklistItems?.length ?? card._count?.checklistItems ?? 0;
  const checklistDone = card.checklistDone ?? 0;
  const isChecklistComplete = checklistTotal > 0 && checklistDone === checklistTotal;
  
  const hasDescription = !!card.description;
  const hasComments = !!card._count?.comments && card._count.comments > 0;
  const members = card.members?.map((cm: any) => cm.member) || [];

  const handleOpenCard = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("card", card.id);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleOpenCard}
      className={cn(
        "bg-surface-container-lowest rounded-md p-2 shadow-sm border border-[#091e420f] hover:border-[#091e4224] hover:shadow-card-hover cursor-pointer group active:cursor-grabbing",
        isOverlay && "opacity-95 shadow-card-drag rotate-3"
      )}
    >
      {/* Labels Strip Option vs Chips */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5 pointer-events-none">
          {labels.map((lbl: any) => (
            <div
              key={lbl.id}
              title={lbl.title}
              className="h-2 w-10 rounded-xs"
              style={{ backgroundColor: lbl.color }}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <h4 className="text-[14px] font-medium leading-[1.3] text-on-surface pointer-events-none break-words whitespace-pre-wrap mb-2">
        {card.title}
      </h4>

      {/* Badges and Members Row */}
      <div className="flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 text-on-surface-variant">
          {(card.dueDate || hasDescription || checklistTotal > 0 || hasComments) && (
            <div className="flex items-center gap-2">
              {hasDescription && (
                <div title="This card has a description.">
                  <AlignLeft className="w-3.5 h-3.5" />
                </div>
              )}
              {card.dueDate && (
                <div title="Due date">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              )}
              {checklistTotal > 0 && (
                <div className={cn("flex items-center gap-1 text-[12px]", isChecklistComplete && "text-[#1d4a10] bg-[#61bd4f]/20 px-1 rounded-sm")}>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>{checklistDone}/{checklistTotal}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Member Avatars */}
        {members.length > 0 && (
          <div className="flex items-center justify-end z-[0]">
            {members.slice(0, 3).map((m: any) => (
              <Avatar 
                key={m.id} 
                src={m.avatarUrl} 
                name={m.name} 
                size="sm" 
                className="-ml-1 border border-white/50 shadow-sm" 
              />
            ))}
            {members.length > 3 && (
              <div className="w-6 h-6 rounded-full -ml-1 border border-white/50 bg-surface-container-high text-[10px] font-bold flex items-center justify-center">
                +{members.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
