import { HeaderNav } from '@/components/shell/HeaderNav';
import { Footer } from '@/components/shell/Footer';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderNav />
      <div id="main-content">{children}</div>
      <Footer />
    </>
  );
}
