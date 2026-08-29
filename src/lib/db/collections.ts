import { prisma } from "@/lib/prisma";

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

/**
 * Resolves the active user ID for data fetching.
 * Defaults to demo user until auth sessions are fully active.
 */
export async function getDefaultUserId(): Promise<string | null> {
  const demoUser = await prisma.user.findUnique({
    where: { email: "demo@devstash.io" },
    select: { id: true },
  });

  if (demoUser) return demoUser.id;

  const firstUser = await prisma.user.findFirst({
    select: { id: true },
  });

  return firstUser?.id ?? null;
}

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

  const collections = await prisma.collection.findMany({
    where: {
      userId: targetUserId,
    },
    take: limit,
    orderBy: {
      updatedAt: "desc",
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
    },
  });

  return collections.map((col) => {
    // 1. Calculate item type counts and distinct types
    const typeCountMap = new Map<string, number>();
    const distinctTypes = new Set<string>();

    for (const itemRel of col.items) {
      const typeName = itemRel.item.itemType.name.toLowerCase();
      distinctTypes.add(typeName);
      typeCountMap.set(typeName, (typeCountMap.get(typeName) || 0) + 1);
    }

    // 2. Determine dominant content type
    let dominantTypeName: string | null = null;
    let maxCount = 0;

    for (const [typeName, count] of typeCountMap.entries()) {
      if (count > maxCount) {
        maxCount = count;
        dominantTypeName = typeName;
      }
    }

    // Fall back to defaultType or neutral
    if (!dominantTypeName && col.defaultType) {
      dominantTypeName = col.defaultType.name.toLowerCase();
    }

    const accentColor: CollectionAccentColor = dominantTypeName
      ? TYPE_NAME_TO_COLOR_MAP[dominantTypeName] || "neutral"
      : "neutral";

    // 3. Compile type icons for bottom display
    let typeIcons: string[] = Array.from(distinctTypes);
    if (typeIcons.length === 0) {
      if (col.defaultType?.name) {
        typeIcons = [col.defaultType.name.toLowerCase()];
      } else {
        typeIcons = ["folder"];
      }
    }

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
  });
}

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
