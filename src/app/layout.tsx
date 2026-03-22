import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document Engine",
  description: "AI-powered municipal financial document generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14 items-center">
              <a href="/reports" className="text-lg font-semibold text-gray-900">
                Document Engine
              </a>
              <TenantConfig />
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}

function TenantConfig() {
  return (
    <div className="flex items-center gap-3 text-sm">
      <label className="text-gray-500">Tenant:</label>
      <input
        id="tenant-input"
        type="text"
        defaultValue="default"
        className="border border-gray-300 rounded px-2 py-1 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => {
          if (typeof window !== "undefined") {
            localStorage.setItem("tenantId", e.target.value);
          }
        }}
      />
    </div>
  );
}
