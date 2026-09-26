import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getDefaultUserId } from "@/lib/db/collections";

export interface UserProfileInfo {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isPro: boolean;
  createdAt: Date;
  hasPassword: boolean;
  providers: string[];
}

export interface ItemTypeCount {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
  isSystem: boolean;
}

export interface ProfileStats {
  totalItems: number;
  totalCollections: number;
  itemTypeBreakdown: ItemTypeCount[];
}

export interface ProfilePageData {
  user: UserProfileInfo;
  stats: ProfileStats;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

const SYSTEM_ITEM_ORDER = [
  "snippet",
  "prompt",
  "command",
  "note",
  "file",
  "image",
  "link",
];

/**
 * Fetches the user profile and associated usage statistics for the profile page.
 */
export async function getProfilePageData(
  userId?: string,
): Promise<ProfilePageData | null> {
  const targetUserId = userId || (await getDefaultUserId());

  if (!targetUserId) {
    return null;
  }

  const [dbUser, totalItems, totalCollections, itemTypes, itemCounts] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          isPro: true,
          createdAt: true,
          password: true,
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      }),
      prisma.item.count({
        where: { userId: targetUserId },
      }),
      prisma.collection.count({
        where: { userId: targetUserId },
      }),
      prisma.itemType.findMany({
        where: {
          OR: [{ isSystem: true }, { userId: targetUserId }],
        },
      }),
      prisma.item.groupBy({
        by: ["itemTypeId"],
        where: { userId: targetUserId },
        _count: { _all: true },
      }),
    ]);

  if (!dbUser) {
    return null;
  }

  const countMap = new Map(
    itemCounts.map((c) => [c.itemTypeId, c._count._all]),
  );

  // Sort item types according to standard 7 system types order
  const sortedItemTypes = [...itemTypes].sort((a, b) => {
    const aIndex = SYSTEM_ITEM_ORDER.indexOf(a.name.toLowerCase());
    const bIndex = SYSTEM_ITEM_ORDER.indexOf(b.name.toLowerCase());

    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  const itemTypeBreakdown: ItemTypeCount[] = sortedItemTypes.map((type) => ({
    id: type.id,
    name: type.name,
    icon: type.icon,
    color: type.color,
    count: countMap.get(type.id) ?? 0,
    isSystem: type.isSystem,
  }));

  const providers = Array.from(
    new Set([
      ...dbUser.accounts.map((a) => a.provider),
      ...(dbUser.password ? ["credentials"] : []),
    ]),
  );

  return {
    user: {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      image: dbUser.image,
      isPro: dbUser.isPro,
      createdAt: dbUser.createdAt,
      hasPassword: Boolean(dbUser.password),
      providers,
    },
    stats: {
      totalItems,
      totalCollections,
      itemTypeBreakdown,
    },
  };
}

/**
 * Changes a user's password after verifying the existing password.
 */
export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  if (newPassword.length < 8) {
    return {
      success: false,
      error: "New password must be at least 8 characters long.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "User account not found." };
  }

  if (!user.password) {
    return {
      success: false,
      error:
        "This account was created via GitHub OAuth and does not have a password set.",
    };
  }

  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    return { success: false, error: "Current password is incorrect." };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
    },
  });

  return { success: true };
}

/**
 * Permanently deletes a user account and associated records (cascading items & collections).
 */
export async function deleteUserAccount(
  userId: string,
): Promise<DeleteAccountResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "User account not found." };
  }

  if (user.email.toLowerCase() === "demo@devstash.io") {
    return {
      success: false,
      error: "The demo user account cannot be deleted.",
    };
  }

  // Delete any verification or password reset tokens for this user
  await prisma.verificationToken.deleteMany({
    where: {
      OR: [
        { identifier: user.email.toLowerCase() },
        { identifier: `reset:${user.email.toLowerCase()}` },
      ],
    },
  });

  // Delete user record (cascades to items, collections, accounts, sessions)
  await prisma.user.delete({
    where: { id: user.id },
  });

  return { success: true };
}
