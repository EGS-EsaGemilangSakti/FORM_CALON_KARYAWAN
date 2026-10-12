import type { ReactNode } from 'react';
import logoEsa from '../../assets/logo_fix.svg';

interface FormCardProps {
  children: ReactNode;
}

export function FormCard({ children }: FormCardProps) {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-[#e5e2e1]">
      <div className="mx-auto min-h-screen max-w-3xl bg-[#131313] shadow-2xl">
        <header className="sticky top-0 z-20 border-b border-[#f2ca50]/15 bg-[#131313]/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-5">
            <img src={logoEsa} alt="PT ESA Gemilang Sakti" className="h-10 w-auto shrink-0 object-contain" />
            <h1 className="text-lg font-bold tracking-normal text-[#f2ca50] sm:text-2xl">PT ESA GEMILANG SAKTI</h1>
          </div>
        </header>
        <div>{children}</div>
      </div>
    </main>
  );
}
