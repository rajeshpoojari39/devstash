import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getProfilePageData } from "@/lib/db/profile";
import { ProfileCard } from "@/components/profile/profile-card";

export const metadata: Metadata = {
  title: "Profile - DevStash",
  description: "User account profile, usage statistics, and settings",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=/profile");
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
    redirect("/sign-in?callbackUrl=/profile");
  }

  const profileData = await getProfilePageData(targetUserId);

  if (!profileData) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          User Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal details, developer statistics, and security
          settings
        </p>
      </div>

      {/* Main Profile Grid View */}
      <ProfileCard user={profileData.user} stats={profileData.stats} />
    </div>
  );
}
