import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/db/collections";

export interface ItemTypeInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DashboardItem {
  id: string;
  title: string;
  contentType: string;
  content: string | null;
  description: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  url: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  createdAt: Date;
  updatedAt: Date;
  itemTypeId: string;
  itemType: ItemTypeInfo;
  tags: string[];
}

/**
 * Fetches all pinned items for a given user ordered by newest first.
 */
export async function getDashboardPinnedItems(
  userId?: string,
): Promise<DashboardItem[]> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
      isPinned: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      itemType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.contentType,
    content: item.content,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    language: item.language,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemTypeId: item.itemTypeId,
    itemType: item.itemType,
    tags: item.tags.map((tag) => tag.name),
  }));
}

/**
 * Fetches recent items for the dashboard (up to `limit` items, default 10) ordered by newest first.
 */
export async function getDashboardRecentItems(
  userId?: string,
  limit: number = 10,
): Promise<DashboardItem[]> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
    },
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      itemType: {
        select: {
          id: true,
          name: true,
          icon: true,
          color: true,
        },
      },
      tags: {
        select: {
          name: true,
        },
      },
    },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    contentType: item.contentType,
    content: item.content,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    language: item.language,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    fileSize: item.fileSize,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    itemTypeId: item.itemTypeId,
    itemType: item.itemType,
    tags: item.tags.map((tag) => tag.name),
  }));
}
