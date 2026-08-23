import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { TopBar } from "@/components/dashboard/top-bar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground flex flex-col">
        {/* Full-width TopBar across top */}
        <TopBar />

        {/* Layout Area below TopBar */}
        <div className="flex flex-1 min-h-[calc(100vh-3.5rem)] w-full overflow-x-hidden">
          {/* Desktop Collapsible Sidebar with border-r */}
          <Sidebar />

          {/* Mobile Drawer Sidebar */}
          <MobileSidebar />

          {/* Main Content Area */}
          <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
