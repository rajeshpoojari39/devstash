import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/db/collections";

export interface ItemTypeInfo {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface SidebarItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}

export interface SidebarCollection {
  id: string;
  name: string;
  isFavorite: boolean;
  itemCount: number;
  dominantColor: string;
  dominantTypeName: string | null;
  updatedAt: Date;
}

export interface SidebarUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface SidebarData {
  itemTypes: SidebarItemType[];
  collections: SidebarCollection[];
  user: SidebarUser | null;
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

  const safeLimit =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), 100)
      : 10;

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
    },
    take: safeLimit,
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
 * Fetches all system item types (and custom types) along with the active user's item count per type.
 */
export async function getSidebarItemTypes(
  userId?: string,
): Promise<SidebarItemType[]> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  const [itemTypes, itemCounts] = await Promise.all([
    prisma.itemType.findMany({
      where: {
        OR: [{ isSystem: true }, { userId: targetUserId }],
      },
      orderBy: { id: "asc" },
    }),
    prisma.item.groupBy({
      by: ["itemTypeId"],
      where: { userId: targetUserId },
      _count: { _all: true },
    }),
  ]);

  const countMap = new Map(
    itemCounts.map((c) => [c.itemTypeId, c._count._all]),
  );

  return itemTypes.map((type) => ({
    id: type.id,
    name: type.name,
    icon: type.icon,
    color: type.color,
    count: countMap.get(type.id) ?? 0,
  }));
}

/**
 * Fetches user collections for the sidebar with dominant item type colors and item counts.
 */
export async function getSidebarCollections(
  userId?: string,
): Promise<SidebarCollection[]> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: {
      userId: targetUserId,
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    include: {
      defaultType: {
        select: {
          name: true,
          color: true,
        },
      },
      items: {
        take: 20,
        select: {
          item: {
            select: {
              itemType: {
                select: {
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
  });

  return collections.map((col) => {
    const typeCountMap = new Map<string, { count: number; color: string }>();

    for (const itemRel of col.items) {
      const typeName = itemRel.item.itemType.name.toLowerCase();
      const color = itemRel.item.itemType.color;
      const current = typeCountMap.get(typeName) || { count: 0, color };
      typeCountMap.set(typeName, { count: current.count + 1, color });
    }

    let dominantTypeName: string | null = null;
    let dominantColor = "#6b7280"; // neutral default
    let maxCount = 0;

    for (const [typeName, info] of typeCountMap.entries()) {
      if (info.count > maxCount) {
        maxCount = info.count;
        dominantTypeName = typeName;
        dominantColor = info.color;
      }
    }

    if (!dominantTypeName && col.defaultType) {
      dominantTypeName = col.defaultType.name.toLowerCase();
      dominantColor = col.defaultType.color;
    }

    return {
      id: col.id,
      name: col.name,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      dominantColor,
      dominantTypeName,
      updatedAt: col.updatedAt,
    };
  });
}

/**
 * Fetches user profile for the sidebar footer.
 */
export async function getSidebarUser(
  userId?: string,
): Promise<SidebarUser | null> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isPro: true,
    },
  });

  return user;
}

/**
 * Composite query fetching all sidebar data concurrently in parallel.
 */
export async function getSidebarData(userId?: string): Promise<SidebarData> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return {
      itemTypes: [],
      collections: [],
      user: null,
    };
  }

  const [itemTypes, collections, user] = await Promise.all([
    getSidebarItemTypes(targetUserId),
    getSidebarCollections(targetUserId),
    getSidebarUser(targetUserId),
  ]);

  return {
    itemTypes,
    collections,
    user,
  };
}
