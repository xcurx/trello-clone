import { isAfter, isBefore, isToday } from "date-fns";
import type {
  DueDateFilter,
  WorkspaceList,
} from "@/types/board-workspace";

interface FilterBoardListsParams {
  lists: WorkspaceList[];
  query: string;
  selectedLabelIds: string[];
  selectedMemberIds: string[];
  dueDateFilter: DueDateFilter;
}

export function filterBoardLists({
  lists,
  query,
  selectedLabelIds,
  selectedMemberIds,
  dueDateFilter,
}: FilterBoardListsParams) {
  const now = new Date();
  const weekFromNow = new Date(now);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const normalizedQuery = query.trim().toLowerCase();

  return lists
    .map((list) => ({
      ...list,
      cards: list.cards.filter((card) => {
        const matchesQuery = normalizedQuery
          ? card.title.toLowerCase().includes(normalizedQuery)
          : true;

        const matchesLabels =
          selectedLabelIds.length === 0
            ? true
            : selectedLabelIds.every((labelId) =>
                card.labels.some((entry) => entry.label.id === labelId),
              );

        const matchesMembers =
          selectedMemberIds.length === 0
            ? true
            : selectedMemberIds.every((memberId) =>
                card.members.some((entry) => entry.member.id === memberId),
              );

        const dueDate = card.dueDate ? new Date(card.dueDate) : null;
        const matchesDueDate =
          dueDateFilter === "all" ||
          (dueDateFilter === "none" && !dueDate) ||
          (dueDateFilter === "overdue" &&
            !!dueDate &&
            isBefore(dueDate, now) &&
            !isToday(dueDate)) ||
          (dueDateFilter === "today" && !!dueDate && isToday(dueDate)) ||
          (dueDateFilter === "week" &&
            !!dueDate &&
            (isToday(dueDate) ||
              (isAfter(dueDate, now) && isBefore(dueDate, weekFromNow))));

        return matchesQuery && matchesLabels && matchesMembers && matchesDueDate;
      }),
    }))
    .filter((list) => list.cards.length > 0);
}

export function getFilteredTrackWidth(listCount: number) {
  if (listCount === 0) return 0;
  return 272 * listCount + 12 * (listCount - 1);
}

export function getActiveFilterCount(
  query: string,
  selectedLabelIds: string[],
  selectedMemberIds: string[],
  dueDateFilter: DueDateFilter,
) {
  return (
    (query.trim().length > 0 ? 1 : 0) +
    selectedLabelIds.length +
    selectedMemberIds.length +
    (dueDateFilter !== "all" ? 1 : 0)
  );
}
