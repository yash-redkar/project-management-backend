import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AuthProvider } from "@/context/auth-context";
import { GlobalChatListener } from "@/components/chat/global-chat-listener";
import { GlobalNotificationListener } from "@/components/notifications/global-notification-listener";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AuthProvider>
        <GlobalChatListener />
        <GlobalNotificationListener />
        <DashboardShell>{children}</DashboardShell>
      </AuthProvider>
    </ProtectedRoute>
  );
}
