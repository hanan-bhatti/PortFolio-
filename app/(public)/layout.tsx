import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import LazyBackground from "@/components/3d/LazyBackground";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LazyBackground />
      <Navbar />
      <main className="relative z-10 min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
