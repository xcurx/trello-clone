"use client";

import { format } from "date-fns";
import {
  Activity,
  AlignLeft,
  CheckSquare,
  Clock,
  CreditCard,
  Plus,
  Tag,
  UserRoundPlus,
  X,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Dialog } from "@/components/ui/Dialog";
import { EditableText } from "@/components/ui/EditableText";
import { Popover } from "@/components/ui/Popover";
import type {
  ApiResponse,
  CardDetail,
  CommentData,
  LabelData,
  MemberData,
} from "@/types";

type CardModalState = CardDetail & {
  list: {
    id: string;
    title: string;
    boardId: string;
  };
};

async function fetchJson<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);
  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    throw new Error(body.success ? "Request failed" : body.error);
  }

  return body.data;
}

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  const localDate = new Date(date.getTime() - timezoneOffset);
  return localDate.toISOString().slice(0, 16);
}

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

  useEffect(() => {
    if (!cardId) {
      setCard(null);
      setBoardLabels([]);
      setAllMembers([]);
      setLabelQuery("");
      setNewChecklistTitle("");
      setNewComment("");
      setDueDateValue("");
      return;
    }

    const loadCard = async () => {
      setLoading(true);

      try {
        const nextCard = await fetchJson<CardModalState>(
          `/api/cards/${cardId}`,
        );
        setCard(nextCard);
        setDescValue(nextCard.description ?? "");
        setDueDateValue(toDateTimeLocalValue(nextCard.dueDate));

        const [labels, members] = await Promise.all([
          fetchJson<LabelData[]>(`/api/boards/${nextCard.list.boardId}/labels`),
          fetchJson<MemberData[]>("/api/members"),
        ]);

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

  const handleClose = () => {
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

  if (!cardId) return null;

  const saveCardPatch = async (patch: Partial<CardDetail>) => {
    if (!card) return;

    const updatedCard = await fetchJson<CardDetail>(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

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

  const handleToggleMember = async (member: MemberData) => {
    if (!card) return;

    const isAssigned = selectedMemberIds.has(member.id);

    if (isAssigned) {
      await fetchJson<{ removed: true }>(
        `/api/cards/${card.id}/members/${member.id}`,
        { method: "DELETE" },
      );

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
      const createdMember = await fetchJson<{
        id: string;
        member: MemberData;
      }>(`/api/cards/${card.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });

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
      await fetchJson<{ removed: true }>(
        `/api/cards/${card.id}/labels/${label.id}`,
        {
          method: "DELETE",
        },
      );

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
      const createdLabel = await fetchJson<{
        id: string;
        label: LabelData;
      }>(`/api/cards/${card.id}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId: label.id }),
      });

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

    const item = await fetchJson<{
      id: string;
      cardId: string;
      title: string;
      isCompleted: boolean;
      position: number;
    }>(`/api/cards/${card.id}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newChecklistTitle.trim() }),
    });

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
    const updatedItem = await fetchJson<{
      id: string;
      cardId: string;
      title: string;
      isCompleted: boolean;
      position: number;
    }>(`/api/checklist/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted }),
    });

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
    await fetchJson<{ deleted: true }>(`/api/checklist/${itemId}`, {
      method: "DELETE",
    });

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

  const handleAddComment = async () => {
    if (!card || !newComment.trim()) return;

    const createdComment = await fetchJson<CommentData>(
      `/api/cards/${card.id}/comments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      },
    );

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

  return (
    <Dialog
      isOpen={!!cardId}
      onClose={handleClose}
      className="p-0 bg-surface-container-lowest"
    >
      {card?.coverColor ? (
        <div
          className="h-24 w-full rounded-t-xl"
          style={{ backgroundColor: card.coverColor }}
        />
      ) : null}

      {loading ? (
        <div className="p-8 text-center text-on-surface-variant">
          Loading...
        </div>
      ) : card ? (
        <div className="flex flex-col gap-6 p-4 text-on-surface sm:flex-row sm:p-6">
          <div className="flex-1 space-y-8">
            <div className="flex gap-4">
              <CreditCard className="mt-1 h-6 w-6 shrink-0 text-on-surface-variant" />
              <div className="min-w-0 flex-1">
                <EditableText
                  value={card.title}
                  onChange={(newValue) => {
                    setCard({ ...card, title: newValue });
                    saveCardPatch({ title: newValue }).catch(console.error);
                  }}
                  as="h2"
                  textClassName="mb-1 text-xl font-semibold"
                  inputClassName="text-xl"
                  className="-ml-1"
                />
                <p className="text-sm text-on-surface-variant">
                  in list <span className="underline">{card.list.title}</span>
                </p>

                {(card.labels.length > 0 ||
                  card.members.length > 0 ||
                  card.dueDate ||
                  checklistStats.total > 0) && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {card.labels.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                          Labels
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {card.labels.map(({ id, label }) => (
                            <span
                              key={id}
                              className="rounded-sm px-3 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: label.color,
                                color: "#ffffff",
                              }}
                            >
                              {label.title || "Untitled"}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {card.members.length > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                          Members
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {card.members.map(({ id, member }) => (
                            <div
                              key={id}
                              className="flex items-center gap-2 rounded-full bg-surface-container px-2.5 py-1"
                            >
                              <Avatar
                                src={member.avatarUrl}
                                name={member.name}
                                size="sm"
                              />
                              <span className="text-xs font-medium">
                                {member.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {card.dueDate ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                          Due date
                        </p>
                        <div className="inline-flex items-center gap-2 rounded-md bg-surface-container px-3 py-2 text-sm">
                          <Clock className="h-4 w-4 text-on-surface-variant" />
                          <span>
                            {format(
                              new Date(card.dueDate),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </span>
                        </div>
                      </div>
                    ) : null}

                    {checklistStats.total > 0 ? (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                          Checklist
                        </p>
                        <div className="inline-flex items-center gap-2 rounded-md bg-surface-container px-3 py-2 text-sm">
                          <CheckSquare className="h-4 w-4 text-on-surface-variant" />
                          <span>
                            {checklistStats.completed}/{checklistStats.total}{" "}
                            complete
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <AlignLeft className="mt-1 h-6 w-6 shrink-0 text-on-surface-variant" />
              <div className="flex-1">
                <h3 className="mb-3 text-base font-semibold">Description</h3>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      className="min-h-[108px] w-full resize-y rounded-md border-2 border-primary bg-surface p-3 text-sm text-on-surface outline-none"
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
                        className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingDescription(false);
                          setDescValue(card.description ?? "");
                        }}
                        className="rounded-sm px-3 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : card.description ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDescValue(card.description ?? "");
                      setIsEditingDescription(true);
                    }}
                    className="min-h-[56px] w-full rounded-md bg-surface-container p-3 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-high"
                  >
                    <span className="whitespace-pre-wrap">
                      {card.description}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDescValue("");
                      setIsEditingDescription(true);
                    }}
                    className="min-h-[56px] w-full rounded-md bg-surface-container p-3 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high"
                  >
                    Add a more detailed description...
                  </button>
                )}
              </div>
            </div>

            {card.checklistItems.length > 0 ? (
              <div className="flex gap-4">
                <CheckSquare className="mt-1 h-6 w-6 shrink-0 text-on-surface-variant" />
                <div className="flex-1">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold">Checklist</h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      {checklistStats.completed}/{checklistStats.total}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {card.checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-container"
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
                          className="h-4 w-4 rounded-sm accent-[var(--color-primary-container)]"
                        />
                        <span
                          className={`flex-1 text-sm ${
                            item.isCompleted
                              ? "text-on-surface-variant line-through"
                              : "text-on-surface"
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
                          className="rounded-sm p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                          aria-label={`Delete checklist item ${item.title}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex gap-4">
              <Activity className="mt-1 h-6 w-6 shrink-0 text-on-surface-variant" />
              <div className="flex-1">
                <h3 className="mb-4 text-base font-semibold">Activity</h3>

                <div className="mb-4 flex gap-3">
                  <Avatar name="You" size="sm" />
                  <div className="flex-1 space-y-2">
                    <textarea
                      className="min-h-[84px] w-full rounded-md bg-surface-container-low p-3 text-sm text-on-surface outline-none transition-colors focus:bg-surface-container"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddComment().catch(console.error)}
                      disabled={!newComment.trim()}
                      className="rounded-sm bg-primary px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Save comment
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {card.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar
                        src={comment.member.avatarUrl}
                        name={comment.member.name}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-sm font-semibold">
                            {comment.member.name}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {format(
                              new Date(comment.createdAt),
                              "MMM d 'at' h:mm a",
                            )}
                          </span>
                        </div>
                        <div className="rounded-md bg-surface-container px-3 py-2 text-sm text-on-surface">
                          {comment.content}
                        </div>
                      </div>
                    </div>
                  ))}

                  {card.comments.length === 0 ? (
                    <p className="text-sm text-on-surface-variant">
                      No activity yet. Add the first comment for this card.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 space-y-6 sm:mt-8 sm:w-[168px]">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Add to card
              </h4>

              <Popover
                trigger={
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm bg-surface-container px-3 py-1.5 text-left text-sm font-medium transition-colors hover:bg-surface-container-high"
                  >
                    <UserRoundPlus className="h-4 w-4" />
                    Members
                  </button>
                }
                title="Members"
                side="bottom"
                align="end"
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

              <Popover
                trigger={
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm bg-surface-container px-3 py-1.5 text-left text-sm font-medium transition-colors hover:bg-surface-container-high"
                  >
                    <Tag className="h-4 w-4" />
                    Labels
                  </button>
                }
                title="Labels"
                side="bottom"
                align="end"
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
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm bg-surface-container px-3 py-1.5 text-left text-sm font-medium transition-colors hover:bg-surface-container-high"
                  >
                    <Plus className="h-4 w-4" />
                    Checklist
                  </button>
                }
                title="Checklist"
                side="bottom"
                align="end"
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
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm bg-surface-container px-3 py-1.5 text-left text-sm font-medium transition-colors hover:bg-surface-container-high"
                  >
                    <Clock className="h-4 w-4" />
                    Dates
                  </button>
                }
                title="Dates"
                side="bottom"
                align="end"
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
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-error">Failed to load card</div>
      )}
    </Dialog>
  );
}
