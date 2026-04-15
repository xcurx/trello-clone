"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { CreditCard, AlignLeft, CheckSquare, Activity } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { format } from "date-fns";
import { EditableText } from "@/components/ui/EditableText";
import { Popover } from "@/components/ui/Popover";

export function CardModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const cardId = searchParams.get("card");
  
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descValue, setDescValue] = useState("");

  useEffect(() => {
    if (cardId) {
      setLoading(true);
      fetch(`/api/cards/${cardId}`)
        .then((res) => res.json())
        .then((resBody) => {
          if (resBody.success) {
            setCard(resBody.data);
          } else {
            console.error(resBody.error);
            setCard(null);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setCard(null);
    }
  }, [cardId]);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("card");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!cardId) return null;

  return (
    <Dialog isOpen={!!cardId} onClose={handleClose} className="p-0 bg-surface-container-lowest">
      {/* Cover Strip Option */}
      {card?.coverColor && (
        <div className="h-24 w-full rounded-t-xl" style={{ backgroundColor: card.coverColor }} />
      )}
      
      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">Loading...</div>
      ) : card ? (
        <div className="flex flex-col sm:flex-row gap-6 p-4 sm:p-6 text-on-surface">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Header */}
            <div className="flex gap-4">
              <CreditCard className="w-6 h-6 mt-1 text-on-surface-variant flex-shrink-0" />
              <div>
              <EditableText
                  value={card.title}
                  onChange={(newVal) => {
                    fetch(`/api/cards/${card.id}`, { method: 'PATCH', body: JSON.stringify({ title: newVal }) });
                    setCard({ ...card, title: newVal });
                  }}
                  as="h2"
                  textClassName="text-xl font-semibold mb-1"
                  inputClassName="text-xl"
                  className="-ml-1"
                />
                <p className="text-sm text-on-surface-variant">
                  in list <span className="underline cursor-pointer">{card.list?.title}</span>
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="flex gap-4">
              <AlignLeft className="w-6 h-6 mt-1 text-on-surface-variant flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base font-semibold mb-3">Description</h3>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea 
                      autoFocus
                      className="w-full text-sm bg-surface text-on-surface p-3 rounded-md min-h-[108px] border-2 border-primary outline-none focus:ring-0 custom-scrollbar resize-y"
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          const newDesc = descValue.trim();
                          fetch(`/api/cards/${card.id}`, { method: 'PATCH', body: JSON.stringify({ description: newDesc }) });
                          setCard({ ...card, description: newDesc });
                          setIsEditingDescription(false);
                        }
                      }}
                      placeholder="Add a more detailed description..."
                    />
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          const newDesc = descValue.trim();
                          fetch(`/api/cards/${card.id}`, { method: 'PATCH', body: JSON.stringify({ description: newDesc }) });
                          setCard({ ...card, description: newDesc });
                          setIsEditingDescription(false);
                        }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-1.5 rounded-sm text-sm font-medium transition-colors"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => {
                          setIsEditingDescription(false);
                          setDescValue(card.description || "");
                        }}
                        className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-3 py-1.5 rounded-sm transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : card.description ? (
                  <div 
                    onClick={() => {
                      setDescValue(card.description);
                      setIsEditingDescription(true);
                    }}
                    className="text-sm bg-surface-container p-3 rounded-md min-h-[56px] cursor-pointer hover:bg-surface-container-high transition-colors text-on-surface whitespace-pre-wrap"
                  >
                    {card.description}
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      setDescValue("");
                      setIsEditingDescription(true);
                    }}
                    className="text-sm bg-surface-container p-3 rounded-md min-h-[56px] cursor-pointer hover:bg-surface-container-high transition-colors text-on-surface-variant"
                  >
                    Add a more detailed description...
                  </div>
                )}
              </div>
            </div>

            {/* Checklists */}
            {card.checklistItems?.length > 0 && (
              <div className="flex gap-4">
                <CheckSquare className="w-6 h-6 mt-1 text-on-surface-variant flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-base font-semibold mb-3">Checklist</h3>
                  <div className="space-y-2">
                    {card.checklistItems.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 group">
                        <input 
                          type="checkbox" 
                          checked={item.isCompleted} 
                          readOnly
                          className="w-4 h-4 rounded-sm border-gray-300 text-primary focus:ring-primary hove:ring-2"
                        />
                        <span className={`text-sm flex-1 ${item.isCompleted ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Comments / Activity */}
            <div className="flex gap-4">
              <Activity className="w-6 h-6 mt-1 text-on-surface-variant flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base font-semibold mb-4">Activity</h3>
                
                <div className="space-y-4">
                  {card.comments?.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar name={comment.member.name} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-sm">{comment.member.name}</span>
                          <span className="text-xs text-on-surface-variant">
                            {format(new Date(comment.createdAt), "MMM d 'at' h:mm a")}
                          </span>
                        </div>
                        <div className="bg-surface-container px-3 py-2 rounded-md text-sm text-on-surface">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full sm:w-[168px] shrink-0 space-y-6 sm:mt-8">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Add to card</h4>
              <Popover
                trigger={
                  <button className="w-full bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-sm text-sm font-medium text-left flex items-center gap-2">
                    Members
                  </button>
                }
                title="Members"
                side="bottom"
                align="end"
              >
                <div className="space-y-2 p-1">
                   <p className="text-xs text-on-surface-variant pt-2">Members feature coming soon.</p>
                </div>
              </Popover>
              <Popover
                trigger={
                  <button className="w-full bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-sm text-sm font-medium text-left flex items-center gap-2">
                    Labels
                  </button>
                }
                title="Labels"
                side="bottom"
                align="end"
              >
                <div className="space-y-2 p-1">
                   <input type="text" placeholder="Search labels..." className="w-full text-sm border-2 border-primary rounded-sm p-1.5 outline-none bg-surface" />
                   <p className="text-xs text-on-surface-variant pt-2">Labels configuration coming soon.</p>
                </div>
              </Popover>
              <Popover
                trigger={
                  <button className="w-full bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-sm text-sm font-medium text-left flex items-center gap-2">
                    Checklist
                  </button>
                }
                title="Checklist"
                side="bottom"
                align="end"
              >
                 <div className="space-y-2 p-1">
                   <p className="text-xs text-on-surface-variant pt-2">Checklist wizard coming soon.</p>
                </div>
              </Popover>
              <Popover
                trigger={
                  <button className="w-full bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-sm text-sm font-medium text-left flex items-center gap-2">
                    Dates
                  </button>
                }
                title="Dates"
                side="bottom"
                align="end"
              >
                 <div className="space-y-2 p-1">
                   <p className="text-xs text-on-surface-variant pt-2">Date picker coming soon.</p>
                </div>
              </Popover>
              <Popover
                trigger={
                  <button className="w-full bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-sm text-sm font-medium text-left flex items-center gap-2">
                    Attachment
                  </button>
                }
                title="Attachment"
                side="bottom"
                align="end"
              >
                 <div className="space-y-2 p-1">
                   <p className="text-xs text-on-surface-variant pt-2">Upload modal coming soon.</p>
                </div>
              </Popover>
              <button className="w-full bg-surface-container hover:bg-surface-container-high transition-colors px-3 py-1.5 rounded-sm text-sm font-medium text-left flex items-center gap-2">
                Cover
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-error">Failed to load card</div>
      )}
    </Dialog>
  );
}
