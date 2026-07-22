import { headers } from "next/headers";
import { AppLayout } from "@/components/layout/AppLayout";

export default async function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  // Full storytelling memorial page — no global app chrome
  const isMemorialStory =
    /^\/memoriale\/[^/]+$/.test(pathname) && !pathname.endsWith("/crea");

  if (isMemorialStory) {
    return <>{children}</>;
  }

  return <AppLayout>{children}</AppLayout>;
}
