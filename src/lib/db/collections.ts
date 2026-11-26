import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { DashboardItem } from "@/lib/db/items";

export type CollectionAccentColor =
  | "blue"
  | "purple"
  | "orange"
  | "yellow"
  | "emerald"
  | "pink"
  | "neutral";

export interface DashboardCollection {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  itemCount: number;
  accentColor: CollectionAccentColor;
  typeIcons: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionDetail extends DashboardCollection {
  items: DashboardItem[];
}

export interface DashboardStats {
  totalItems: number;
  totalCollections: number;
  favoriteItems: number;
  favoriteCollections: number;
}

const TYPE_NAME_TO_COLOR_MAP: Record<string, CollectionAccentColor> = {
  snippet: "blue",
  prompt: "purple",
  command: "orange",
  note: "yellow",
  file: "neutral",
  image: "pink",
  link: "emerald",
};

const COLLECTION_SUMMARY_INCLUDE = {
  defaultType: {
    select: {
      name: true,
      color: true,
      icon: true,
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
              icon: true,
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
} as const;

interface CollectionPresentationSource {
  defaultType: { name: string } | null;
  items: { item: { itemType: { name: string } } }[];
}

function computeCollectionPresentation(source: CollectionPresentationSource): {
  accentColor: CollectionAccentColor;
  typeIcons: string[];
} {
  const typeCountMap = new Map<string, number>();
  const distinctTypes = new Set<string>();

  for (const itemRel of source.items) {
    const typeName = itemRel.item.itemType.name.toLowerCase();
    distinctTypes.add(typeName);
    typeCountMap.set(typeName, (typeCountMap.get(typeName) || 0) + 1);
  }

  let dominantTypeName: string | null = null;
  let maxCount = 0;

  for (const [typeName, count] of typeCountMap.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantTypeName = typeName;
    }
  }

  if (!dominantTypeName && source.defaultType) {
    dominantTypeName = source.defaultType.name.toLowerCase();
  }

  const accentColor: CollectionAccentColor = dominantTypeName
    ? TYPE_NAME_TO_COLOR_MAP[dominantTypeName] || "neutral"
    : "neutral";

  let typeIcons: string[] = Array.from(distinctTypes);
  if (typeIcons.length === 0) {
    if (source.defaultType?.name) {
      typeIcons = [source.defaultType.name.toLowerCase()];
    } else {
      typeIcons = ["folder"];
    }
  }

  return { accentColor, typeIcons };
}

interface CollectionSummaryRecord extends CollectionPresentationSource {
  id: string;
  name: string;
  description: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { items: number };
}

function mapCollectionSummary(col: CollectionSummaryRecord): DashboardCollection {
  const { accentColor, typeIcons } = computeCollectionPresentation(col);

  return {
    id: col.id,
    name: col.name,
    description: col.description,
    isFavorite: col.isFavorite,
    itemCount: col._count.items,
    accentColor,
    typeIcons,
    createdAt: col.createdAt,
    updatedAt: col.updatedAt,
  };
}

/**
 * Resolves the active user ID for data fetching.
 * Wrapped with React.cache() to deduplicate requests within a single render pass.
 * Defaults to demo user until auth sessions are fully active.
 */
export const getDefaultUserId = cache(async (): Promise<string | null> => {
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  });

  return demoUser?.id ?? null;
});

/**
 * Fetches recent collections for the dashboard with computed dominant item type colors
 * and unique type icons.
 */
export async function getDashboardCollections(
  userId?: string,
  limit: number = 6,
): Promise<DashboardCollection[]> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return [];
  }

  const safeLimit =
    typeof limit === "number" && Number.isFinite(limit) && limit > 0
      ? Math.min(Math.floor(limit), 50)
      : 6;

  const collections = await prisma.collection.findMany({
    where: {
      userId: targetUserId,
    },
    take: safeLimit,
    orderBy: {
      updatedAt: "desc",
    },
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return collections.map(mapCollectionSummary);
}

/**
 * Fetches all collections belonging to the specified user with computed dominant item type
 * colors and unique type icons, ordered with favorites first and most recently updated.
 */
export async function getAllCollections(
  userId: string,
): Promise<DashboardCollection[]> {
  if (!userId) {
    return [];
  }

  const collections = await prisma.collection.findMany({
    where: {
      userId,
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    include: COLLECTION_SUMMARY_INCLUDE,
  });

  return collections.map(mapCollectionSummary);
}

/**
 * Fetches a single collection and all its items scoped to the specified user.
 * Memoized per request via `React.cache` to deduplicate metadata and page queries.
 * Returns null if the collection does not exist or belongs to another user.
 */
export const getCollectionById = cache(
  async (
    collectionId: string,
    userId: string,
  ): Promise<CollectionDetail | null> => {
    if (!collectionId || !userId) {
      return null;
    }

    const collection = await prisma.collection.findFirst({
      where: {
        id: collectionId,
        userId,
      },
      include: {
        defaultType: {
          select: {
            name: true,
            color: true,
            icon: true,
          },
        },
        items: {
          orderBy: [
            { item: { isPinned: "desc" } },
            { item: { createdAt: "desc" } },
          ],
          include: {
            item: {
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

    if (!collection) {
      return null;
    }

    const { accentColor, typeIcons } =
      computeCollectionPresentation(collection);

    const items: DashboardItem[] = collection.items.map(({ item }) => ({
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

    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      isFavorite: collection.isFavorite,
      itemCount: collection._count.items,
      accentColor,
      typeIcons,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      items,
    };
  },
);

/**
 * Fetches dashboard summary counts for items and collections.
 */
export async function getDashboardStats(
  userId?: string,
): Promise<DashboardStats> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return {
      totalItems: 0,
      totalCollections: 0,
      favoriteItems: 0,
      favoriteCollections: 0,
    };
  }

  const [totalItems, totalCollections, favoriteItems, favoriteCollections] =
    await Promise.all([
      prisma.item.count({
        where: { userId: targetUserId },
      }),
      prisma.collection.count({
        where: { userId: targetUserId },
      }),
      prisma.item.count({
        where: { userId: targetUserId, isFavorite: true },
      }),
      prisma.collection.count({
        where: { userId: targetUserId, isFavorite: true },
      }),
    ]);

  return {
    totalItems,
    totalCollections,
    favoriteItems,
    favoriteCollections,
  };
}

export interface CreateCollectionData {
  name: string;
  description?: string | null;
}

/**
 * Creates a new collection in the database scoped to the specified user.
 * Returns the created collection formatted as a DashboardCollection.
 */
export async function createCollection(
  userId: string,
  data: CreateCollectionData,
): Promise<DashboardCollection> {
  if (!userId) {
    throw new Error("User ID is required to create a collection.");
  }

  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("Collection name is required.");
  }

  const cleanDescription = data.description?.trim()
    ? data.description.trim()
    : null;

  const created = await prisma.collection.create({
    data: {
      name: trimmedName,
      description: cleanDescription,
      userId,
    },
  });

  return {
    id: created.id,
    name: created.name,
    description: created.description,
    isFavorite: created.isFavorite,
    itemCount: 0,
    accentColor: "neutral",
    typeIcons: ["folder"],
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

