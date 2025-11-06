import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
// import { ProtectedRoute } from '@/components/admin/ProtectedRoute'; // Disabled for development

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <ProtectedRoute> // Disabled for development
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
    // </ProtectedRoute> // Disabled for development
  );
}

