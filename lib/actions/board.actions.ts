"use server";

import { cardService } from "@/lib/services/card.service";
import { listService } from "@/lib/services/list.service";

export async function reorderListsAction(boardId: string, orderedIds: string[]) {
  try {
    await listService.reorder(boardId, orderedIds);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder lists", error);
    return { success: false, error: "Failed to reorder lists" };
  }
}

export async function reorderCardsAction(listId: string, orderedIds: string[]) {
  try {
    await cardService.reorder(listId, orderedIds);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder cards", error);
    return { success: false, error: "Failed to reorder cards" };
  }
}

export async function moveCardAction(cardId: string, targetListId: string, endPosition: number) {
  try {
    const updatedCard = await cardService.move(cardId, targetListId, endPosition);
    return { success: true, card: updatedCard };
  } catch (error) {
    console.error("Failed to move card", error);
    return { success: false, error: "Failed to move card" };
  }
}
