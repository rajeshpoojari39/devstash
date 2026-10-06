import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/db/collections";
import {
  ItemTypeInfo,
  normalizeItemTypeSlug,
  formatItemTypeTitle,
  getItemTypeDescription,
} from "@/lib/item-utils";

export type { ItemTypeInfo };
export { normalizeItemTypeSlug, formatItemTypeTitle, getItemTypeDescription };

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

export interface ItemDetailCollection {
  id: string;
  name: string;
}

export interface ItemDetail {
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
  collections: ItemDetailCollection[];
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

/**
 * Fetches an item type definition by slug or name (supports both singular and plural forms).
 */
export async function getItemTypeBySlug(
  slug: string,
  userId?: string | null,
): Promise<ItemTypeInfo | null> {
  const targetUserId = userId || (await getDefaultUserId());
  const normalized = normalizeItemTypeSlug(slug);
  const raw = slug.trim().toLowerCase();

  const itemType = await prisma.itemType.findFirst({
    where: {
      OR: [
        { name: { equals: normalized, mode: "insensitive" } },
        { name: { equals: raw, mode: "insensitive" } },
      ],
      AND: [
        {
          OR: [
            { isSystem: true },
            ...(targetUserId ? [{ userId: targetUserId }] : []),
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  });

  return itemType;
}

/**
 * Fetches all items belonging to a specific item type for a user, ordered newest first.
 */
export async function getItemsByType(
  itemTypeId: string,
  userId?: string | null,
): Promise<DashboardItem[]> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  const items = await prisma.item.findMany({
    where: {
      userId: targetUserId,
      itemTypeId: itemTypeId,
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
 * Fetches a single item's full detail by its ID, scoped to the specified user.
 */
export async function getItemById(
  id: string,
  userId?: string | null,
): Promise<ItemDetail | null> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId || !id) {
    return null;
  }

  const item = await prisma.item.findFirst({
    where: {
      id: id,
      userId: targetUserId,
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
      collections: {
        select: {
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!item) {
    return null;
  }

  return {
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
    collections: item.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
    })),
  };
}

export interface UpdateItemData {
  title?: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  tags?: string[];
}

/**
 * Updates an item's details, tags, and timestamps, scoped to the specified user.
 * Disconnects existing tags and reconnects/creates new ones.
 * Returns the updated ItemDetail.
 */
export async function updateItem(
  id: string,
  userId: string,
  data: UpdateItemData,
): Promise<ItemDetail | null> {
  if (!id || !userId) {
    return null;
  }

  // Ensure item exists and belongs to user
  const existingItem = await prisma.item.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!existingItem) {
    return null;
  }

  // Ensure all tags exist before connecting
  if (data.tags !== undefined) {
    const cleanTagNames = Array.from(
      new Set(
        data.tags
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
      ),
    );

    for (const name of cleanTagNames) {
      await prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }
  }

  const cleanTagNames =
    data.tags !== undefined
      ? Array.from(
          new Set(
            data.tags
              .map((t) => t.trim())
              .filter((t) => t.length > 0),
          ),
        )
      : undefined;

  const updatedItem = await prisma.item.update({
    where: {
      id,
    },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() || null }
        : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.url !== undefined ? { url: data.url?.trim() || null } : {}),
      ...(data.language !== undefined
        ? { language: data.language?.trim() || null }
        : {}),
      ...(cleanTagNames !== undefined
        ? {
            tags: {
              set: cleanTagNames.map((name) => ({ name })),
            },
          }
        : {}),
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
      collections: {
        select: {
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    id: updatedItem.id,
    title: updatedItem.title,
    contentType: updatedItem.contentType,
    content: updatedItem.content,
    description: updatedItem.description,
    isFavorite: updatedItem.isFavorite,
    isPinned: updatedItem.isPinned,
    language: updatedItem.language,
    url: updatedItem.url,
    fileUrl: updatedItem.fileUrl,
    fileName: updatedItem.fileName,
    fileSize: updatedItem.fileSize,
    createdAt: updatedItem.createdAt,
    updatedAt: updatedItem.updatedAt,
    itemTypeId: updatedItem.itemTypeId,
    itemType: updatedItem.itemType,
    tags: updatedItem.tags.map((tag) => tag.name),
    collections: updatedItem.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
    })),
  };
}

/**
 * Deletes an item by its ID, scoped to the specified user.
 * Returns true if successfully deleted, false if item not found or does not belong to user.
 */
export async function deleteItem(
  id: string,
  userId: string,
): Promise<boolean> {
  if (!id || !userId) {
    return false;
  }

  // Ensure item exists and belongs to user
  const existingItem = await prisma.item.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!existingItem) {
    return false;
  }

  await prisma.item.delete({
    where: {
      id,
    },
  });

  return true;
}

export interface CreateItemData {
  type: string;
  title: string;
  description?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  tags?: string[];
}

/**
 * Creates a new item in the database, connecting or creating tags and linking to the resolved item type.
 * Returns the created ItemDetail.
 */
export async function createItem(
  userId: string,
  data: CreateItemData,
): Promise<ItemDetail> {
  if (!userId) {
    throw new Error("User ID is required to create an item.");
  }

  const normalizedType = normalizeItemTypeSlug(data.type);
  const rawType = data.type.trim().toLowerCase();

  const itemType = await prisma.itemType.findFirst({
    where: {
      OR: [
        { name: { equals: normalizedType, mode: "insensitive" } },
        { name: { equals: rawType, mode: "insensitive" } },
      ],
      AND: [
        {
          OR: [{ isSystem: true }, { userId }],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      icon: true,
      color: true,
    },
  });

  if (!itemType) {
    throw new Error(`Item type '${data.type}' not found.`);
  }

  const cleanTagNames =
    data.tags !== undefined
      ? Array.from(
          new Set(
            data.tags
              .map((t) => t.trim())
              .filter((t) => t.length > 0),
          ),
        )
      : [];

  for (const name of cleanTagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const contentType = normalizedType === "link" ? "URL" : "TEXT";

  const createdItem = await prisma.item.create({
    data: {
      userId,
      itemTypeId: itemType.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      contentType,
      content: contentType === "TEXT" ? data.content || null : null,
      url: contentType === "URL" ? data.url?.trim() || null : null,
      language: contentType === "TEXT" ? data.language?.trim() || null : null,
      ...(cleanTagNames.length > 0
        ? {
            tags: {
              connect: cleanTagNames.map((name) => ({ name })),
            },
          }
        : {}),
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
      collections: {
        select: {
          collection: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return {
    id: createdItem.id,
    title: createdItem.title,
    contentType: createdItem.contentType,
    content: createdItem.content,
    description: createdItem.description,
    isFavorite: createdItem.isFavorite,
    isPinned: createdItem.isPinned,
    language: createdItem.language,
    url: createdItem.url,
    fileUrl: createdItem.fileUrl,
    fileName: createdItem.fileName,
    fileSize: createdItem.fileSize,
    createdAt: createdItem.createdAt,
    updatedAt: createdItem.updatedAt,
    itemTypeId: createdItem.itemTypeId,
    itemType: createdItem.itemType,
    tags: createdItem.tags.map((tag) => tag.name),
    collections: createdItem.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
    })),
  };
}

