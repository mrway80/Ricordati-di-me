import LayoutWrapper from "./layout-wrapper";

export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>;
}
