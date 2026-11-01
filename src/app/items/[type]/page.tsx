import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getItemTypeBySlug, getItemsByType } from "@/lib/db/items";
import {
  formatItemTypeTitle,
  getItemTypeDescription,
  isImageItemType,
  isFileItemType,
} from "@/lib/item-utils";
import { ItemCard } from "@/components/dashboard/item-card";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { FileListItem } from "@/components/items/file-list-item";
import { ItemsListHeader } from "@/components/items/items-list-header";
import { ItemsEmptyState } from "@/components/items/items-empty-state";

export const dynamic = "force-dynamic";

interface ItemTypePageProps {
  params: Promise<{
    type: string;
  }>;
}

export async function generateMetadata({ params }: ItemTypePageProps) {
  const { type } = await params;
  const itemType = await getItemTypeBySlug(type);

  if (!itemType) {
    return {
      title: "Category Not Found | DevStash",
    };
  }

  const title = formatItemTypeTitle(itemType.name);
  return {
    title: `${title} | DevStash`,
    description: getItemTypeDescription(itemType.name),
  };
}

export default async function ItemTypePage({ params }: ItemTypePageProps) {
  const { type } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/sign-in?callbackUrl=/items/${encodeURIComponent(type)}`);
  }

  let targetUserId: string | undefined = session.user.id;

  if (!targetUserId && session.user.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    targetUserId = user?.id;
  }

  if (!targetUserId) {
    redirect(`/sign-in?callbackUrl=/items/${encodeURIComponent(type)}`);
  }

  const itemType = await getItemTypeBySlug(type, targetUserId);

  if (!itemType) {
    notFound();
  }

  const items = await getItemsByType(itemType.id, targetUserId);
  const isImageCategory = isImageItemType(itemType.name);
  const isFileCategory = isFileItemType(itemType.name);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header section with breadcrumbs, icon, title, count & description */}
      <ItemsListHeader itemType={itemType} count={items.length} />

      {/* Items Section */}
      {items.length === 0 ? (
        <ItemsEmptyState itemType={itemType} />
      ) : isFileCategory ? (
        <div className="space-y-2">
          {/* List Table Header for Desktop */}
          <div className="hidden sm:flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
            <div className="flex-1 pl-[52px]">File Name</div>
            <div className="flex items-center gap-6 shrink-0">
              <div className="w-20 text-right">Size</div>
              <div className="w-28 text-left">Uploaded</div>
              <div className="w-20 text-right pr-2">Actions</div>
            </div>
          </div>

          {/* Single-Column List Rows */}
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <FileListItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : isImageCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ImageThumbnailCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
