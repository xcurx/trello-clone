import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-[#1d2125]">
      <Navbar />
      <main className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#1d2125]">
        {children}
      </main>
    </div>
  );
}
