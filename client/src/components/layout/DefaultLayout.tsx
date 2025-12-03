
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { ReactNode } from "react";

interface DefaultLayoutProps {
  children: ReactNode;
}
// const bgStyle = {
//   backgroundImage: "url('/bg2.jpg')",
//   backgroundSize: "cover",
//   backgroundPosition: "center center",
//   backgroundRepeat: "no-repeat"
// };

export function DefaultLayout({ children }: DefaultLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col capitalize bg-[#01422c]  z-10  overflow-hidden">
      <SiteHeader />
      <main className="flex-1 ">{children}</main>
      <SiteFooter />
    </div>
  );
}
