import { TopBar } from "@/components/dashboard/top-bar";
import { DevStashLogo } from "@/components/brand/logo";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Placeholder */}
      <aside className="w-64 border-r border-border min-h-screen flex flex-col shrink-0 bg-background">
        {/* Logo & Brand Header */}
        <div className="flex h-14 items-center px-5">
          <DevStashLogo size="md" />
        </div>

        {/* Sidebar Body Placeholder */}
        <div className="flex-1 px-5 py-2">
          <h2 className="text-xl font-semibold tracking-tight text-muted-foreground">
            Sidebar
          </h2>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

