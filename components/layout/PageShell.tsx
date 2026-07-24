import type { ReactNode } from "react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import ScrollProgress from "@/components/ui/ScrollProgress";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AnimatedBackground />
      <ScrollProgress />
      <Header />
      {/* Header is now a floating fixed pill (doesn't occupy layout flow), so
          give page content clearance from the top; Hero cancels this with a
          matching negative margin so its background still reaches y=0. */}
      <main className="flex-1 pt-28">{children}</main>
      <Footer />
    </>
  );
}
