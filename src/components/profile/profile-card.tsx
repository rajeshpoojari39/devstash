"use client";

import * as React from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ArrowLeft,
  LogOut,
  Mail,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";

interface ProfileCardProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    isPro?: boolean;
  };
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/sign-in" });
  }

  return (
    <Card className="w-full max-w-lg border-border/80 bg-card/95 shadow-xl backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
        <div>
          <CardTitle className="text-xl font-bold">User Profile</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">
            Manage your account and preferences
          </CardDescription>
        </div>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-1.5 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Avatar & Main Identity */}
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.name}
            email={user.email}
            image={user.image}
            size="lg"
            className="h-16 w-16 text-lg border-2 border-border"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {user.name || "Developer"}
              </h3>
              {user.isPro ? (
                <Badge
                  variant="default"
                  className="bg-primary text-primary-foreground text-[10px] font-bold uppercase"
                >
                  PRO
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] font-medium">
                  FREE
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {user.email || "No email connected"}
            </p>
          </div>
        </div>

        {/* Account Details List */}
        <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>Full Name</span>
            </div>
            <span className="font-medium text-foreground">
              {user.name || "Not provided"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </div>
            <span className="font-medium text-foreground font-mono text-xs sm:text-sm">
              {user.email || "Not provided"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>Account Type</span>
            </div>
            <span className="font-medium text-foreground">
              {user.isPro ? "DevStash Pro Tier" : "Standard Tier"}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-4">
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="cursor-pointer">
            Return to Dashboard
          </Button>
        </Link>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5 cursor-pointer"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="h-4 w-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
