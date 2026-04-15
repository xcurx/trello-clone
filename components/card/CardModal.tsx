"use client";

import { format } from "date-fns";
import {
  AlignLeft,
  Archive,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock,
  Eye,
  Image as ImageIcon,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Tag,
  UserRoundPlus,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  addCardLabel,
  addCardMember,
  createCardComment,
  createChecklistItem,
  deleteChecklistItem,
  loadCardModalData,
  patchCardDetails,
  patchChecklistItem,
  removeCardLabel,
  removeCardMember,
} from "@/components/card/card-modal/api";
import {
  toDateTimeLocalValue,
} from "@/components/card/card-modal/utils";
import { ActivitySidebar } from "@/components/card/card-modal/ActivitySidebar";
import { CoverPopoverContent } from "@/components/card/card-modal/CoverPopoverContent";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { EditableText } from "@/components/ui/EditableText";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type { CardDetail, LabelData, MemberData } from "@/types";
import type { CardModalState } from "@/types/card-modal";

export function CardModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const cardId = searchParams.get("card");

  const [card, setCard] = useState<CardModalState | null>(null);
  const [boardLabels, setBoardLabels] = useState<LabelData[]>([]);
  const [allMembers, setAllMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descValue, setDescValue] = useState("");
  const [labelQuery, setLabelQuery] = useState("");
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [dueDateValue, setDueDateValue] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [isActivityVisible, setIsActivityVisible] = useState(true);

  useEffect(() => {
    if (!cardId) {
      setCard(null);
      setBoardLabels([]);
      setAllMembers([]);
      setLabelQuery("");
      setNewChecklistTitle("");
      setNewComment("");
      setDueDateValue("");
      setIsActivityVisible(true);
      return;
    }

    const loadCard = async () => {
      setLoading(true);

      try {
        const { card: nextCard, labels, members } = await loadCardModalData(cardId);
        setCard(nextCard);
        setDescValue(nextCard.description ?? "");
        setDueDateValue(toDateTimeLocalValue(nextCard.dueDate));

        setBoardLabels(labels);
        setAllMembers(members);
      } catch (error) {
        console.error(error);
        setCard(null);
        setBoardLabels([]);
        setAllMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadCard().catch(console.error);
  }, [cardId]);

  useEffect(() => {
    if (cardId) {
      setIsClosing(false);
      setIsActivityVisible(true);
    }
  }, [cardId]);

  const handleClose = () => {
    if (isClosing) return;

    setIsClosing(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("card");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const refreshBoard = () => {
    router.refresh();
  };

  const selectedLabelIds = useMemo(
    () => new Set(card?.labels.map((entry) => entry.label.id) ?? []),
    [card],
  );

  const selectedMemberIds = useMemo(
    () => new Set(card?.members.map((entry) => entry.member.id) ?? []),
    [card],
  );

  const filteredLabels = useMemo(() => {
    const query = labelQuery.trim().toLowerCase();
    if (!query) return boardLabels;

    return boardLabels.filter((label) => {
      const title = label.title.toLowerCase();
      const color = label.color.toLowerCase();
      return title.includes(query) || color.includes(query);
    });
  }, [boardLabels, labelQuery]);

  if (!cardId || isClosing) return null;

  const saveCardPatch = async (patch: Partial<CardDetail>) => {
    if (!card) return;

    const updatedCard = await patchCardDetails(card.id, patch);

    setCard((current) =>
      current
        ? {
            ...current,
            ...updatedCard,
          }
        : current,
    );
    refreshBoard();
  };

  const handleToggleCardArchivedState = async () => {
    if (!card) return;
    await saveCardPatch({ isArchived: !card.isArchived });
  };

  const handleToggleMember = async (member: MemberData) => {
    if (!card) return;

    const isAssigned = selectedMemberIds.has(member.id);

    if (isAssigned) {
      await removeCardMember(card.id, member.id);

      setCard((current) =>
        current
          ? {
              ...current,
              members: current.members.filter(
                (entry) => entry.member.id !== member.id,
              ),
            }
          : current,
      );
    } else {
      const createdMember = await addCardMember(card.id, member.id);

      setCard((current) =>
        current
          ? {
              ...current,
              members: [...current.members, createdMember],
            }
          : current,
      );
    }

    refreshBoard();
  };

  const handleToggleLabel = async (label: LabelData) => {
    if (!card) return;

    const isSelected = selectedLabelIds.has(label.id);

    if (isSelected) {
      await removeCardLabel(card.id, label.id);

      setCard((current) =>
        current
          ? {
              ...current,
              labels: current.labels.filter(
                (entry) => entry.label.id !== label.id,
              ),
            }
          : current,
      );
    } else {
      const createdLabel = await addCardLabel(card.id, label.id);

      setCard((current) =>
        current
          ? {
              ...current,
              labels: [...current.labels, createdLabel],
            }
          : current,
      );
    }

    refreshBoard();
  };

  const handleAddChecklistItem = async () => {
    if (!card || !newChecklistTitle.trim()) return;

    const item = await createChecklistItem(card.id, newChecklistTitle.trim());

    setCard((current) =>
      current
        ? {
            ...current,
            checklistItems: [...current.checklistItems, item].sort(
              (left, right) => left.position - right.position,
            ),
          }
        : current,
    );
    setNewChecklistTitle("");
    refreshBoard();
  };

  const handleToggleChecklistItem = async (
    itemId: string,
    isCompleted: boolean,
  ) => {
    const updatedItem = await patchChecklistItem(itemId, isCompleted);

    setCard((current) =>
      current
        ? {
            ...current,
            checklistItems: current.checklistItems.map((item) =>
              item.id === itemId ? updatedItem : item,
            ),
          }
        : current,
    );
    refreshBoard();
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    await deleteChecklistItem(itemId);

    setCard((current) =>
      current
        ? {
            ...current,
            checklistItems: current.checklistItems.filter(
              (item) => item.id !== itemId,
            ),
          }
        : current,
    );
    refreshBoard();
  };

  const handleSaveDueDate = async () => {
    const nextDueDate = dueDateValue
      ? new Date(dueDateValue).toISOString()
      : null;
    await saveCardPatch({ dueDate: nextDueDate });
  };

  const handleSetCoverColor = async (color: string) => {
    if (!card || card.coverColor === color) return;
    await saveCardPatch({ coverColor: color });
  };

  const handleRemoveCoverColor = async () => {
    if (!card || !card.coverColor) return;
    await saveCardPatch({ coverColor: null });
  };

  const handleAddComment = async () => {
    if (!card || !newComment.trim()) return;

    const createdComment = await createCardComment(card.id, newComment.trim());

    setCard((current) =>
      current
        ? {
            ...current,
            comments: [createdComment, ...current.comments],
          }
        : current,
    );
    setNewComment("");
    refreshBoard();
  };

  const checklistStats = card
    ? {
        completed: card.checklistItems.filter((item) => item.isCompleted)
          .length,
        total: card.checklistItems.length,
      }
    : { completed: 0, total: 0 };

  const actionChipClass =
    "inline-flex h-9 items-center gap-2 rounded-md border border-white/12 bg-white/5 px-3 text-sm font-medium text-white/82 transition-colors hover:bg-white/10";

  return (
    <Dialog
      isOpen={!!cardId}
      onClose={handleClose}
      className="max-w-[1080px] overflow-hidden bg-[#252a33] p-0 text-white"
    >
      {loading ? (
        <div className="p-10 text-center text-white/62">
          Loading...
        </div>
      ) : card ? (
        <div className="relative pb-9">
          <div className="overflow-hidden">
            {card.coverColor ? (
              <div
                className="h-24 w-full sm:h-28"
                style={{ backgroundColor: card.coverColor }}
              />
            ) : null}

            <div className="flex h-14 items-center justify-between border-b border-white/10 bg-black/14 px-4">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1 rounded-md bg-[#1f7a52] px-3 text-sm font-semibold text-white"
              >
                {card.list.title}
                <ChevronDown className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1 pr-9">
                <Popover
                  trigger={
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Card cover"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  }
                  title="Cover"
                  side="bottom"
                  align="end"
                  contentClassName="w-[300px] border-white/10 bg-[#2b2e38] text-white"
                >
                  <CoverPopoverContent
                    selectedColor={card.coverColor}
                    onSelectColor={(color) => {
                      handleSetCoverColor(color).catch(console.error);
                    }}
                    onRemoveColor={() => {
                      handleRemoveCoverColor().catch(console.error);
                    }}
                  />
                </Popover>
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Watch card"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <Popover
                  trigger={
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="More"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  }
                  title="Actions"
                  side="bottom"
                  align="end"
                  contentClassName="w-44 bg-[#2b2e38] text-white border-white/10"
                >
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleCardArchivedState().catch(console.error);
                    }}
                    className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8"
                  >
                    {card.isArchived ? "Restore" : "Archive"}
                  </button>
                </Popover>
              </div>
            </div>

            {card.isArchived ? (
              <div className="flex items-center gap-2 border-b border-white/10 bg-white/14 px-4 py-2 text-sm text-white/84">
                <Archive className="h-4 w-4" />
                This card was archived on {format(new Date(card.updatedAt), "d MMM yyyy 'at' HH:mm")}
              </div>
            ) : null}

            <div
              className={cn(
                "grid min-h-[520px] grid-cols-1",
                isActivityVisible && "lg:grid-cols-[minmax(0,1fr)_460px]",
              )}
            >
              <div className="space-y-7 px-6 pb-6 pt-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#8bc34a]" />
                  <div className="min-w-0 flex-1">
                    <EditableText
                      value={card.title}
                      onChange={(newValue) => {
                        setCard({ ...card, title: newValue });
                        saveCardPatch({ title: newValue }).catch(console.error);
                      }}
                      as="h2"
                      textClassName="text-[24px] font-semibold leading-[1.14] text-white/92 sm:text-[30px]"
                      inputClassName="text-[24px] font-semibold leading-[1.14] sm:text-[30px]"
                      className="-ml-1 rounded-md hover:bg-white/8"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className={actionChipClass}>
                    <Plus className="h-4 w-4" />
                    Add
                  </button>

                <Popover
                  trigger={
                    <button type="button" className={actionChipClass}>
                      <Tag className="h-4 w-4" />
                      Labels
                    </button>
                  }
                  title="Labels"
                  side="bottom"
                  align="start"
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search labels..."
                      className="w-full rounded-sm border-2 border-primary bg-surface p-1.5 text-sm outline-none"
                      value={labelQuery}
                      onChange={(event) => setLabelQuery(event.target.value)}
                    />

                    <div className="space-y-2">
                      {filteredLabels.map((label) => {
                        const isSelected = selectedLabelIds.has(label.id);

                        return (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() =>
                              handleToggleLabel(label).catch(console.error)
                            }
                            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-container"
                          >
                            <span
                              className="h-8 w-12 shrink-0 rounded-sm"
                              style={{ backgroundColor: label.color }}
                            />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                              {label.title || label.color}
                            </span>
                            {isSelected ? (
                              <span className="text-xs font-semibold text-primary">
                                Added
                              </span>
                            ) : null}
                          </button>
                        );
                      })}

                      {filteredLabels.length === 0 ? (
                        <p className="text-xs text-on-surface-variant">
                          No labels match this search.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Popover>

                <Popover
                  trigger={
                    <button type="button" className={actionChipClass}>
                      <Clock className="h-4 w-4" />
                      Dates
                    </button>
                  }
                  title="Dates"
                  side="bottom"
                  align="start"
                >
                  <div className="space-y-3">
                    <input
                      type="datetime-local"
                      className="w-full rounded-sm border-2 border-primary bg-surface p-1.5 text-sm outline-none"
                      value={dueDateValue}
                      onChange={(event) => setDueDateValue(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveDueDate().catch(console.error)}
                        className="flex-1 rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDueDateValue("");
                          saveCardPatch({ dueDate: null }).catch(console.error);
                        }}
                        className="flex-1 rounded-sm bg-surface-container px-3 py-1.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </Popover>

                <Popover
                  trigger={
                    <button type="button" className={actionChipClass}>
                      <CheckSquare className="h-4 w-4" />
                      Checklist
                    </button>
                  }
                  title="Checklist"
                  side="bottom"
                  align="start"
                >
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Checklist item title"
                      className="w-full rounded-sm border-2 border-primary bg-surface p-1.5 text-sm outline-none"
                      value={newChecklistTitle}
                      onChange={(event) =>
                        setNewChecklistTitle(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddChecklistItem().catch(console.error);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleAddChecklistItem().catch(console.error)
                      }
                      disabled={!newChecklistTitle.trim()}
                      className="w-full rounded-sm bg-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add checklist item
                    </button>
                  </div>
                </Popover>

                <Popover
                  trigger={
                    <button type="button" className={actionChipClass}>
                      <UserRoundPlus className="h-4 w-4" />
                      Members
                    </button>
                  }
                  title="Members"
                  side="bottom"
                  align="start"
                >
                  <div className="space-y-2">
                    {allMembers.map((member) => {
                      const isSelected = selectedMemberIds.has(member.id);

                      return (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() =>
                            handleToggleMember(member).catch(console.error)
                          }
                          className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors ${
                            isSelected
                              ? "bg-primary-fixed text-on-surface"
                              : "hover:bg-surface-container"
                          }`}
                        >
                          <Avatar
                            src={member.avatarUrl}
                            name={member.name}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {member.name}
                            </p>
                            <p className="truncate text-xs text-on-surface-variant">
                              {member.email}
                            </p>
                          </div>
                          {isSelected ? (
                            <span className="text-xs font-semibold text-primary">
                              Added
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </Popover>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-white/84">
                    <AlignLeft className="h-5 w-5" />
                    <h3 className="text-[22px] font-semibold leading-[1.2] sm:text-[24px]">
                      Description
                    </h3>
                  </div>

                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <textarea
                        autoFocus
                        className="min-h-[108px] w-full resize-y rounded-md border border-[#626979] bg-[#2d313b] p-3 text-sm text-white outline-none"
                        value={descValue}
                        onChange={(event) => setDescValue(event.target.value)}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" &&
                            (event.ctrlKey || event.metaKey)
                          ) {
                            event.preventDefault();
                            const nextDescription = descValue.trim();
                            saveCardPatch({
                              description: nextDescription || null,
                            }).catch(console.error);
                            setCard({
                              ...card,
                              description: nextDescription || null,
                            });
                            setIsEditingDescription(false);
                          }
                        }}
                        placeholder="Add a more detailed description..."
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextDescription = descValue.trim();
                            saveCardPatch({
                              description: nextDescription || null,
                            }).catch(console.error);
                            setCard({
                              ...card,
                              description: nextDescription || null,
                            });
                            setIsEditingDescription(false);
                          }}
                          className="rounded-sm bg-[#0c66e4] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0a58c7]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingDescription(false);
                            setDescValue(card.description ?? "");
                          }}
                          className="rounded-sm px-3 py-1.5 text-sm font-medium text-white/68 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDescValue(card.description ?? "");
                        setIsEditingDescription(true);
                      }}
                      className="min-h-[62px] w-full rounded-md border border-[#626979] bg-[#2d313b] p-3 text-left text-[16px] leading-normal text-white/62 transition-colors hover:bg-[#353a45]"
                    >
                      {card.description ? (
                        <span className="whitespace-pre-wrap text-sm text-white/86">
                          {card.description}
                        </span>
                      ) : (
                        "Add a more detailed description..."
                      )}
                    </button>
                  )}
                </div>

                {card.checklistItems.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-white/84">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Checklist</h3>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white/58">
                        {checklistStats.completed}/{checklistStats.total}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {card.checklistItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={(event) =>
                              handleToggleChecklistItem(
                                item.id,
                                event.target.checked,
                              ).catch(console.error)
                            }
                            className="h-4 w-4 rounded-sm accent-primary-container"
                          />
                          <span
                            className={`flex-1 text-sm ${
                              item.isCompleted
                                ? "text-white/45 line-through"
                                : "text-white/88"
                            }`}
                          >
                            {item.title}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteChecklistItem(item.id).catch(
                                console.error,
                              )
                            }
                            className="rounded-sm p-1 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label={`Delete checklist item ${item.title}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {isActivityVisible ? (
                <ActivitySidebar
                  card={card}
                  newComment={newComment}
                  onNewCommentChange={setNewComment}
                  onAddComment={() => {
                    handleAddComment().catch(console.error);
                  }}
                />
              ) : null}
            </div>

            <div className="h-px w-full bg-white/10" />
          </div>

          <div className="pointer-events-none absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2">
            <div className="pointer-events-auto inline-flex items-center overflow-hidden rounded-2xl border border-white/12 bg-[#1d2127] p-1 text-sm font-medium text-white/72 shadow-[0_10px_26px_rgba(0,0,0,0.35)]">
              <button
                type="button"
                onClick={() => setIsActivityVisible((current) => !current)}
                aria-pressed={isActivityVisible}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-xl px-4 transition-colors",
                  isActivityVisible
                    ? "bg-[#0c66e4]/20 text-[#87b6ff]"
                    : "text-white/72 hover:bg-white/8 hover:text-white",
                )}
              >
                <MessageSquare className="h-4 w-4" />
                Comments
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center text-[#ff9f9f]">Failed to load card</div>
      )}
    </Dialog>
  );
}
