"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import {
  LogOut,
  Mail,
  User as UserIcon,
  ShieldCheck,
  Calendar,
  Key,
  Shield,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ProfileStatsSection } from "@/components/profile/profile-stats";
import { ChangePasswordDialog } from "@/components/profile/change-password-dialog";
import { DeleteAccountDialog } from "@/components/profile/delete-account-dialog";
import type { UserProfileInfo, ProfileStats } from "@/lib/db/profile";

interface ProfileCardProps {
  user: UserProfileInfo;
  stats: ProfileStats;
}

export function ProfileCard({ user, stats }: ProfileCardProps) {
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/sign-in" });
  }

  const formattedJoinDate = React.useMemo(() => {
    try {
      const date = new Date(user.createdAt);
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return "Recently";
    }
  }, [user.createdAt]);

  const providerLabel = React.useMemo(() => {
    if (user.providers.includes("github")) {
      return "GitHub OAuth";
    }
    if (user.hasPassword || user.providers.includes("credentials")) {
      return "Email & Password";
    }
    return "Standard Account";
  }, [user.providers, user.hasPassword]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Account Details & Security */}
      <div className="lg:col-span-5 space-y-6">
        {/* User Identity Card */}
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <div className="flex items-center gap-4">
              <UserAvatar
                name={user.name}
                email={user.email}
                image={user.image}
                size="lg"
                className="h-16 w-16 text-xl border-2 border-border/80 shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-foreground truncate">
                    {user.name || "Developer"}
                  </h2>
                  {user.isPro ? (
                    <Badge
                      variant="default"
                      className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider"
                    >
                      PRO
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium uppercase tracking-wider"
                    >
                      FREE
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {user.email || "No email connected"}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UserIcon className="h-4 w-4 shrink-0" />
                  <span>Full Name</span>
                </div>
                <span className="font-medium text-foreground">
                  {user.name || "Not provided"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>Email Address</span>
                </div>
                <span className="font-medium text-foreground font-mono text-xs">
                  {user.email || "Not provided"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Account Tier</span>
                </div>
                <span className="font-medium text-foreground">
                  {user.isPro ? "DevStash Pro Tier" : "Standard Free Tier"}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Member Since</span>
                </div>
                <span className="font-medium text-foreground">
                  {formattedJoinDate}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4 shrink-0" />
                  <span>Auth Provider</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] font-normal border-border/70 text-muted-foreground"
                >
                  {providerLabel}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Danger Zone Card */}
        <Card className="border-border/70 bg-card/80 shadow-sm">
          <CardHeader className="p-5 pb-3 border-b border-border/50">
            <CardTitle className="text-base font-semibold">
              Security & Preferences
            </CardTitle>
            <CardDescription className="text-xs">
              Manage authentication credentials and account actions
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Password Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border/60 bg-muted/15">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>Password</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.hasPassword
                    ? "Update your login password regularly."
                    : "Password is managed by GitHub OAuth."}
                </p>
              </div>

              {user.hasPassword ? (
                <ChangePasswordDialog />
              ) : (
                <Badge
                  variant="secondary"
                  className="text-xs text-muted-foreground font-normal shrink-0"
                >
                  GitHub Managed
                </Badge>
              )}
            </div>

            {/* Danger Zone */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>Delete Account</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Permanently delete account and all items.
                </p>
              </div>

              <DeleteAccountDialog userEmail={user.email} />
            </div>

            {/* Sign Out Action */}
            <div className="pt-2 border-t border-border/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={handleSignOut}
                disabled={isSigningOut}
              >
                <LogOut className="h-4 w-4" />
                <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Statistics & Item Types Breakdown */}
      <div className="lg:col-span-7 space-y-6">
        <ProfileStatsSection stats={stats} />
      </div>
    </div>
  );
}
