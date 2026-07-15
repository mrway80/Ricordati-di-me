import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { getCurrentUser } from "@/app/actions/auth";

interface AppLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export async function AppLayout({ children, showFooter = true }: AppLayoutProps) {
  const userData = await getCurrentUser();

  const user = userData
    ? {
        id: userData.user.id,
        email: userData.user.email ?? "",
        fullName: userData.profile?.full_name ?? null,
        displayName: userData.profile?.display_name ?? null,
        avatarUrl: userData.profile?.avatar_url ?? null,
      }
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
}
