import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { InventoryProvider } from "@/context/inventory-context";
import { AuthProvider } from "@/context/auth-context";
import { AuthGuard } from "@/components/auth-guard";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "M5C Logistics - Inventory Management System",
  description: "Sophisticated and state-of-the-art inventory management for M5C Logistics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body suppressHydrationWarning className={`${inter.className} h-screen overflow-hidden flex bg-background text-foreground selection:bg-primary/20`}>
        {/* Dynamic Background */}
        <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-zinc-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>
        
        <AuthProvider>
          <AuthGuard>
            <InventoryProvider>
              <div className="flex w-full min-h-screen">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <Header />
                  <main className="flex-1 overflow-y-auto">
                    {children}
                  </main>
                </div>
              </div>
              <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="colored" />
            </InventoryProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
