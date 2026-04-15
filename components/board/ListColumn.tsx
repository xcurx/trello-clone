"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, ChevronUp, MoreHorizontal, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  archiveAllCardsInList,
  archiveList,
  createCardInList,
  fetchBoardOptions,
  fetchListsForBoard,
  moveAllCardsInList,
  moveList,
  patchListColor as patchListColorRequest,
  patchListTitle,
} from "@/components/board/list-column/api";
import {
  LIST_COLOR_OPTIONS,
  resolveListTone,
} from "@/components/board/list-column/constants";
import { Dialog } from "@/components/ui/Dialog";
import { EditableText } from "@/components/ui/EditableText";
import { Popover } from "@/components/ui/Popover";
import { cn } from "@/lib/utils";
import type {
  ListColumnProps,
  MoveBoardSummary,
  MoveListSummary,
} from "@/types/list-column";
import { KanbanCard } from "../card/KanbanCard";

export function ListColumn({
  list,
  onRequestCopyList,
  onListPatched,
  isOverlay = false,
}: ListColumnProps) {
  if (isOverlay) {
    return <ListColumnOverlay list={list} />;
  }

  return (
    <SortableListColumn
      list={list}
      onRequestCopyList={onRequestCopyList}
      onListPatched={onListPatched}
    />
  );
}

function SortableListColumn({
  list,
  onRequestCopyList,
  onListPatched,
}: {
  list: ListColumnProps["list"];
  onRequestCopyList?: ListColumnProps["onRequestCopyList"];
  onListPatched?: ListColumnProps["onListPatched"];
}) {
  const cardsIds = useMemo(
    () => list.cards.map((card) => card.id),
    [list.cards],
  );

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isColorSectionOpen, setIsColorSectionOpen] = useState(true);
  const [listColor, setListColor] = useState<string | null>(list.color ?? null);
  const [listActionsMenuVersion, setListActionsMenuVersion] = useState(0);
  const [isMoveListOpen, setIsMoveListOpen] = useState(false);
  const [isMoveAllCardsOpen, setIsMoveAllCardsOpen] = useState(false);
  const [boardOptions, setBoardOptions] = useState<MoveBoardSummary[]>([]);
  const [moveListBoardLists, setMoveListBoardLists] = useState<MoveListSummary[]>(
    [],
  );
  const [moveCardsBoardLists, setMoveCardsBoardLists] = useState<
    MoveListSummary[]
  >([]);
  const [selectedMoveBoardId, setSelectedMoveBoardId] = useState(list.boardId);
  const [selectedMovePosition, setSelectedMovePosition] = useState(
    list.position + 1,
  );
  const [selectedCardsBoardId, setSelectedCardsBoardId] = useState(list.boardId);
  const [selectedTargetListId, setSelectedTargetListId] = useState("");
  const [selectedCardsPosition, setSelectedCardsPosition] = useState(1);
  const [isLoadingBoardOptions, setIsLoadingBoardOptions] = useState(false);
  const [isLoadingMoveListLists, setIsLoadingMoveListLists] = useState(false);
  const [isLoadingMoveCardsLists, setIsLoadingMoveCardsLists] = useState(false);
  const [isMovingList, setIsMovingList] = useState(false);
  const [isMovingCards, setIsMovingCards] = useState(false);
  const [isArchivingList, setIsArchivingList] = useState(false);
  const [isArchivingCards, setIsArchivingCards] = useState(false);
  const [moveListError, setMoveListError] = useState<string | null>(null);
  const [moveCardsError, setMoveCardsError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();
  const tone = resolveListTone(listColor, list.position);

  const moveListPositionCount = useMemo(() => {
    const insertionBaseCount =
      selectedMoveBoardId === list.boardId
        ? Math.max(0, moveListBoardLists.length - 1)
        : moveListBoardLists.length;

    return Math.max(1, insertionBaseCount + 1);
  }, [list.boardId, moveListBoardLists.length, selectedMoveBoardId]);

  const moveCardsListOptions = useMemo(
    () => moveCardsBoardLists.filter((entry) => entry.id !== list.id),
    [list.id, moveCardsBoardLists],
  );

  const selectedTargetList = useMemo(
    () =>
      moveCardsListOptions.find((entry) => entry.id === selectedTargetListId) ??
      null,
    [moveCardsListOptions, selectedTargetListId],
  );

  const moveCardsPositionCount = useMemo(
    () => Math.max(1, (selectedTargetList?.cardsCount ?? 0) + 1),
    [selectedTargetList?.cardsCount],
  );

  const boardSelectOptions =
    boardOptions.length > 0
      ? boardOptions
      : [{ id: list.boardId, title: "Current board" }];

  const canMoveAllCards =
    selectedTargetListId.length > 0 && !isLoadingMoveCardsLists && !isMovingCards;

  const getMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const loadBoardOptionsForDialogs = async () => {
    setIsLoadingBoardOptions(true);

    try {
      const options = await fetchBoardOptions();
      setBoardOptions(options);
      return options;
    } finally {
      setIsLoadingBoardOptions(false);
    }
  };

  const openMoveListDialog = async () => {
    setListActionsMenuVersion((value) => value + 1);
    setMoveListError(null);
    setIsMoveListOpen(true);
    setSelectedMoveBoardId(list.boardId);
    setSelectedMovePosition(list.position + 1);

    try {
      await loadBoardOptionsForDialogs();
      setIsLoadingMoveListLists(true);
      const lists = await fetchListsForBoard(list.boardId);
      setMoveListBoardLists(lists);
    } catch (error) {
      setMoveListError(getMessage(error, "Failed to load move options"));
    } finally {
      setIsLoadingMoveListLists(false);
    }
  };

  const openMoveAllCardsDialog = async () => {
    setListActionsMenuVersion((value) => value + 1);
    setMoveCardsError(null);
    setIsMoveAllCardsOpen(true);
    setSelectedCardsBoardId(list.boardId);
    setSelectedCardsPosition(1);

    try {
      await loadBoardOptionsForDialogs();
      setIsLoadingMoveCardsLists(true);
      const lists = await fetchListsForBoard(list.boardId);
      setMoveCardsBoardLists(lists);

      const firstTarget = lists.find((entry) => entry.id !== list.id);
      setSelectedTargetListId(firstTarget?.id ?? "");
    } catch (error) {
      setMoveCardsError(getMessage(error, "Failed to load move options"));
    } finally {
      setIsLoadingMoveCardsLists(false);
    }
  };

  const handleMoveListBoardChange = async (nextBoardId: string) => {
    setSelectedMoveBoardId(nextBoardId);
    setMoveListError(null);
    setIsLoadingMoveListLists(true);

    try {
      const lists = await fetchListsForBoard(nextBoardId);
      setMoveListBoardLists(lists);

      const insertionBaseCount =
        nextBoardId === list.boardId
          ? Math.max(0, lists.length - 1)
          : lists.length;

      const positionCount = Math.max(1, insertionBaseCount + 1);

      setSelectedMovePosition(
        nextBoardId === list.boardId
          ? Math.min(list.position + 1, positionCount)
          : positionCount,
      );
    } catch (error) {
      setMoveListError(getMessage(error, "Failed to load lists"));
    } finally {
      setIsLoadingMoveListLists(false);
    }
  };

  const handleMoveCardsBoardChange = async (nextBoardId: string) => {
    setSelectedCardsBoardId(nextBoardId);
    setMoveCardsError(null);
    setIsLoadingMoveCardsLists(true);

    try {
      const lists = await fetchListsForBoard(nextBoardId);
      setMoveCardsBoardLists(lists);

      const firstTarget = lists.find((entry) => entry.id !== list.id);
      setSelectedTargetListId(firstTarget?.id ?? "");
      setSelectedCardsPosition(1);
    } catch (error) {
      setMoveCardsError(getMessage(error, "Failed to load lists"));
    } finally {
      setIsLoadingMoveCardsLists(false);
    }
  };

  const handleMoveList = async () => {
    setMoveListError(null);
    setIsMovingList(true);

    try {
      await moveList(list.id, selectedMoveBoardId, selectedMovePosition - 1);

      setIsMoveListOpen(false);
      router.refresh();
    } catch (error) {
      setMoveListError(getMessage(error, "Failed to move list"));
    } finally {
      setIsMovingList(false);
    }
  };

  const handleMoveAllCards = async () => {
    if (!selectedTargetListId) {
      setMoveCardsError("Select a target list");
      return;
    }

    setMoveCardsError(null);
    setIsMovingCards(true);

    try {
      await moveAllCardsInList(
        list.id,
        selectedCardsBoardId,
        selectedTargetListId,
        selectedCardsPosition - 1,
      );

      setIsMoveAllCardsOpen(false);
      router.refresh();
    } catch (error) {
      setMoveCardsError(getMessage(error, "Failed to move cards"));
    } finally {
      setIsMovingCards(false);
    }
  };

  const handleArchiveList = async () => {
    setArchiveError(null);
    setIsArchivingList(true);

    try {
      await archiveList(list.id);

      onListPatched?.(list.id, { isArchived: true });
      setListActionsMenuVersion((value) => value + 1);
      router.refresh();
    } catch (error) {
      setArchiveError(getMessage(error, "Failed to archive list"));
    } finally {
      setIsArchivingList(false);
    }
  };

  const handleArchiveAllCards = async () => {
    setArchiveError(null);
    setIsArchivingCards(true);

    try {
      await archiveAllCardsInList(list.id);

      setListActionsMenuVersion((value) => value + 1);
      router.refresh();
    } catch (error) {
      setArchiveError(getMessage(error, "Failed to archive cards"));
    } finally {
      setIsArchivingCards(false);
    }
  };

  useEffect(() => {
    setListColor(list.color ?? null);
  }, [list.color]);

  useEffect(() => {
    setSelectedMovePosition((value) =>
      Math.min(Math.max(1, value), moveListPositionCount),
    );
  }, [moveListPositionCount]);

  useEffect(() => {
    setSelectedCardsPosition((value) =>
      Math.min(Math.max(1, value), moveCardsPositionCount),
    );
  }, [moveCardsPositionCount]);

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) {
      setIsAddingCard(false);
      return;
    }

    const title = newCardTitle.trim();

    try {
      const newCard = await createCardInList(list.id, title, list.cards.length * 1024);
      list.cards.push(newCard);
      router.refresh();
    } catch (error) {
      console.error(error);
    }

    setNewCardTitle("");
    setIsAddingCard(false);
  };

  const openAddCardComposer = () => {
    setIsAddingCard(true);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const patchListColor = async (color: string | null) => {
    const previousColor = listColor;
    setListColor(color);
    onListPatched?.(list.id, { color });

    try {
      await patchListColorRequest(list.id, color);
      list.color = color;
    } catch (error) {
      console.error(error);
      setListColor(previousColor);
      onListPatched?.(list.id, { color: previousColor });
    }
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
    <>
      <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex max-h-full w-[272px] shrink-0 flex-col overflow-visible rounded-xl text-white shadow-[0_1px_1px_rgba(0,0,0,0.24),0_8px_16px_rgba(0,0,0,0.16)]",
        tone.shell,
      )}
      >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "group flex cursor-grab items-center justify-between px-3 pb-2 pt-3 active:cursor-grabbing",
          tone.header,
        )}
      >
        <EditableText
          value={list.title}
          onChange={(newValue) => {
            patchListTitle(list.id, newValue).catch(console.error);
            list.title = newValue;
            onListPatched?.(list.id, { title: newValue });
          }}
          as="h3"
          textClassName="text-base font-semibold cursor-text"
          inputClassName="text-base text-on-surface"
          className="min-w-0 flex-1 rounded-md bg-transparent px-0 hover:bg-white/6"
        />

        <Popover
          key={listActionsMenuVersion}
          trigger={
            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white/72 transition-colors hover:bg-white/10 hover:text-white"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          title="List actions"
          side="bottom"
          align="end"
          contentClassName="w-[248px] bg-[#2b2e38] text-white border-white/10"
        >
          <div className="space-y-1">
            <button
              type="button"
              onClick={openAddCardComposer}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8"
            >
              Add card
            </button>

            <button
              type="button"
              onClick={() => onRequestCopyList?.(list.id, list.title)}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8"
            >
              Copy list
            </button>

            <button
              type="button"
              onClick={openMoveListDialog}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8"
            >
              Move list
            </button>

            {list.cards.length > 0 ? (
              <button
                type="button"
                onClick={openMoveAllCardsDialog}
                className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8"
              >
                Move all cards in this list
              </button>
            ) : null}

            <button
              type="button"
              disabled
              className="block w-full cursor-not-allowed rounded-md px-2 py-1.5 text-left text-sm text-white/50"
            >
              Watch
            </button>

            <div className="my-2 h-px w-full bg-white/10" />

            <button
              type="button"
              onClick={() => setIsColorSectionOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/86">
                  Change list color
                </span>
                <span className="rounded-sm bg-[#4f3a72] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#d7c8ff]">
                  Premium
                </span>
              </div>

              <ChevronUp
                className={cn(
                  "h-4 w-4 text-white/58 transition-transform",
                  !isColorSectionOpen && "rotate-180",
                )}
              />
            </button>

            {isColorSectionOpen ? (
              <div className="space-y-2 px-2 pb-1 pt-1">
                <div className="grid grid-cols-5 gap-2">
                  {LIST_COLOR_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => patchListColor(option.key)}
                      className={cn(
                        "relative h-8 rounded-sm transition-transform hover:scale-[1.03]",
                        option.swatchClass,
                      )}
                      aria-label={`Set list color to ${option.key}`}
                    >
                      {listColor === option.key ? (
                        <Check className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-black/80" />
                      ) : null}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => patchListColor(null)}
                  className="flex h-8 w-full items-center justify-center gap-2 rounded-sm bg-white/8 text-sm font-medium text-white/82 transition-colors hover:bg-white/12"
                >
                  <X className="h-4 w-4" />
                  Remove color
                </button>
              </div>
            ) : null}

            <div className="my-2 h-px w-full bg-white/10" />

            <button
              type="button"
              onClick={() => {
                void handleArchiveList();
              }}
              disabled={isArchivingList || isArchivingCards}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isArchivingList ? "Archiving list..." : "Archive this list"}
            </button>
            <button
              type="button"
              onClick={() => {
                void handleArchiveAllCards();
              }}
              disabled={list.cards.length === 0 || isArchivingList || isArchivingCards}
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-white/86 transition-colors hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isArchivingCards
                ? "Archiving cards..."
                : "Archive all cards in this list"}
            </button>

            {archiveError ? (
              <p className="px-2 pt-1 text-xs text-[#ffb4b4]">{archiveError}</p>
            ) : null}
          </div>
        </Popover>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-2 pb-2">
        <SortableContext
          id={list.id}
          items={cardsIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {list.cards.map((card) => (
              <KanbanCard key={card.id} card={card} />
            ))}
          </div>
        </SortableContext>

        <div className="pt-0">
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
              onClick={openAddCardComposer}
              className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-medium text-white/78 transition-colors hover:bg-black/12 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add a card
            </button>
          )}
        </div>
      </div>
      </div>

      <Dialog
        isOpen={isMoveListOpen}
        onClose={() => {
          if (!isMovingList) {
            setIsMoveListOpen(false);
          }
        }}
        className="max-w-[360px] border border-white/10 bg-[#2b2e38] text-white"
      >
        <div className="px-5 pb-5 pt-4">
          <h3 className="text-center text-base font-semibold text-white/90">
            Move list
          </h3>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-white/72">Board</span>
              <select
                value={selectedMoveBoardId}
                onChange={(event) => {
                  void handleMoveListBoardChange(event.target.value);
                }}
                disabled={isLoadingBoardOptions || isMovingList}
                className="h-10 w-full rounded-md border border-white/20 bg-[#2b2e38] px-3 text-sm text-white outline-none focus:border-[#8fb8ff]"
              >
                {boardSelectOptions.map((boardOption) => (
                  <option
                    key={boardOption.id}
                    value={boardOption.id}
                    className="bg-[#2b2e38]"
                  >
                    {boardOption.title}
                    {boardOption.id === list.boardId ? " (current)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-white/72">
                Position
              </span>
              <select
                value={selectedMovePosition}
                onChange={(event) => {
                  setSelectedMovePosition(Number(event.target.value));
                }}
                disabled={isLoadingMoveListLists || isMovingList}
                className="h-10 w-full rounded-md border border-white/20 bg-[#2b2e38] px-3 text-sm text-white outline-none focus:border-[#8fb8ff]"
              >
                {Array.from({ length: moveListPositionCount }, (_, index) =>
                  index + 1,
                ).map((position) => (
                  <option
                    key={position}
                    value={position}
                    className="bg-[#2b2e38]"
                  >
                    {position}
                    {selectedMoveBoardId === list.boardId &&
                    position === list.position + 1
                      ? " (current)"
                      : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {moveListError ? (
            <p className="mt-3 text-xs text-[#ffb4b4]">{moveListError}</p>
          ) : null}

          <button
            type="button"
            onClick={handleMoveList}
            disabled={isMovingList || isLoadingMoveListLists}
            className="mt-4 inline-flex h-9 min-w-[88px] items-center justify-center rounded-md bg-[#579dff] px-4 text-sm font-medium text-[#082145] transition-colors hover:bg-[#85b8ff] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isMovingList ? "Moving..." : "Move"}
          </button>
        </div>
      </Dialog>

      <Dialog
        isOpen={isMoveAllCardsOpen}
        onClose={() => {
          if (!isMovingCards) {
            setIsMoveAllCardsOpen(false);
          }
        }}
        className="max-w-[360px] border border-white/10 bg-[#2b2e38] text-white"
      >
        <div className="px-5 pb-5 pt-4">
          <h3 className="text-center text-base font-semibold text-white/90">
            Move all cards in list
          </h3>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm text-white/72">Board</span>
              <select
                value={selectedCardsBoardId}
                onChange={(event) => {
                  void handleMoveCardsBoardChange(event.target.value);
                }}
                disabled={isLoadingBoardOptions || isMovingCards}
                className="h-10 w-full rounded-md border border-white/20 bg-[#2b2e38] px-3 text-sm text-white outline-none focus:border-[#8fb8ff]"
              >
                {boardSelectOptions.map((boardOption) => (
                  <option
                    key={boardOption.id}
                    value={boardOption.id}
                    className="bg-[#2b2e38]"
                  >
                    {boardOption.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-white/72">List</span>
              <select
                value={selectedTargetListId}
                onChange={(event) => {
                  setSelectedTargetListId(event.target.value);
                  setSelectedCardsPosition(1);
                }}
                disabled={isLoadingMoveCardsLists || isMovingCards}
                className="h-10 w-full rounded-md border border-white/20 bg-[#2b2e38] px-3 text-sm text-white outline-none focus:border-[#8fb8ff]"
              >
                {moveCardsListOptions.length === 0 ? (
                  <option value="" className="bg-[#2b2e38]">
                    No destination list
                  </option>
                ) : (
                  moveCardsListOptions.map((targetList) => (
                    <option
                      key={targetList.id}
                      value={targetList.id}
                      className="bg-[#2b2e38]"
                    >
                      {targetList.title}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm text-white/72">
                Position
              </span>
              <select
                value={selectedCardsPosition}
                onChange={(event) => {
                  setSelectedCardsPosition(Number(event.target.value));
                }}
                disabled={!selectedTargetListId || isMovingCards}
                className="h-10 w-full rounded-md border border-white/20 bg-[#2b2e38] px-3 text-sm text-white outline-none focus:border-[#8fb8ff]"
              >
                {Array.from({ length: moveCardsPositionCount }, (_, index) =>
                  index + 1,
                ).map((position) => (
                  <option
                    key={position}
                    value={position}
                    className="bg-[#2b2e38]"
                  >
                    {position}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {moveCardsError ? (
            <p className="mt-3 text-xs text-[#ffb4b4]">{moveCardsError}</p>
          ) : null}

          <button
            type="button"
            onClick={handleMoveAllCards}
            disabled={!canMoveAllCards}
            className="mt-4 inline-flex h-9 min-w-[88px] items-center justify-center rounded-md bg-[#579dff] px-4 text-sm font-medium text-[#082145] transition-colors hover:bg-[#85b8ff] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isMovingCards ? "Moving..." : "Move"}
          </button>
        </div>
      </Dialog>
    </>
  );
}

function ListColumnOverlay({ list }: { list: ListColumnProps["list"] }) {
  const tone = resolveListTone(list.color, list.position);

  return (
    <div
      className={cn(
        "flex max-h-full w-[272px] shrink-0 flex-col overflow-hidden rounded-xl text-white shadow-card-drag",
        tone.shell,
        "rotate-2 opacity-90",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 pb-2 pt-3",
          tone.header,
        )}
      >
        <h3 className="min-w-0 flex-1 truncate text-base font-semibold">
          {list.title}
        </h3>
        <MoreHorizontal className="h-4 w-4 text-current/72" />
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-hidden px-2 pb-2 pt-2">
        {list.cards.slice(0, 4).map((card) => (
          <div
            key={card.id}
            className="rounded-xl bg-[#2b3036] p-3 text-sm font-medium text-white/90 shadow-[0_1px_1px_rgba(0,0,0,0.18)]"
          >
            {card.title}
          </div>
        ))}
      </div>
    </div>
  );
}
