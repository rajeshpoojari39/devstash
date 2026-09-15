import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileCard } from "@/components/profile/profile-card";

export const metadata: Metadata = {
  title: "Profile - DevStash",
  description: "User account profile and settings",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id && !session?.user?.email) {
    redirect("/sign-in?callbackUrl=/profile");
  }

  let dbUser = null;
  if (session?.user?.id) {
    dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isPro: true,
      },
    });
  } else if (session?.user?.email) {
    dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isPro: true,
      },
    });
  }

  const user = {
    id: dbUser?.id || session.user.id || "",
    name: dbUser?.name || session.user.name || "Developer",
    email: dbUser?.email || session.user.email || "",
    image: dbUser?.image || session.user.image || null,
    isPro: dbUser?.isPro ?? false,
  };

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center p-4 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-neutral-900/50 via-background to-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="relative z-10 w-full max-w-lg">
        <ProfileCard user={user} />
      </div>
    </main>
  );
}
