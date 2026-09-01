import { getSidebarData } from "@/lib/db/items";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sidebarData = await getSidebarData();

  return (
    <SidebarProvider>
      <div className="h-screen w-full overflow-hidden bg-background text-foreground flex flex-col">
        {/* Full-width TopBar fixed across top */}
        <TopBar />

        {/* Layout Area below TopBar */}
        <div className="flex flex-1 h-[calc(100vh-3.5rem)] w-full overflow-hidden">
          {/* Desktop Collapsible Sidebar (Fixed height) */}
          <Sidebar
            itemTypes={sidebarData.itemTypes}
            collections={sidebarData.collections}
            user={sidebarData.user}
          />

          {/* Mobile Drawer Sidebar */}
          <MobileSidebar
            itemTypes={sidebarData.itemTypes}
            collections={sidebarData.collections}
            user={sidebarData.user}
          />

          {/* Main Content Area: Only this section scrolls */}
          <main className="flex-1 h-full min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
