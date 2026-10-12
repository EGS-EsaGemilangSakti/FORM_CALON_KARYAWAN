import { Wrench } from 'lucide-react';
import logoEsa from '../assets/logo_fix.svg';

export function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-5 py-12 text-[#e5e2e1]">
      <section aria-labelledby="maintenance-title" className="w-full max-w-xl rounded-2xl border border-[#f2ca50]/20 bg-[#181818] px-6 py-10 text-center shadow-2xl sm:px-10">
        <img src={logoEsa} alt="PT ESA Gemilang Sakti" className="mx-auto h-16 w-auto object-contain" />
        <p className="mt-4 text-sm font-semibold tracking-wide text-[#f2ca50]">PT ESA GEMILANG SAKTI</p>
        <div className="mx-auto mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2ca50]/10">
          <Wrench aria-hidden="true" className="h-7 w-7 text-[#f2ca50]" />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-widest text-[#f2ca50]">Form Penggajian</p>
        <h1 id="maintenance-title" className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">Sedang dalam pemeliharaan</h1>
        <p className="mt-5 text-base leading-7 text-[#d0c5af]">
          Form penggajian sementara tidak tersedia karena sedang dalam pemeliharaan.
          Silakan kembali lagi nanti.
        </p>
        <p className="mt-4 text-sm leading-6 text-[#d0c5af]">Mohon maaf atas ketidaknyamanannya. Terima kasih atas pengertian Anda.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-8 w-full rounded-lg bg-[#f2ca50] px-6 py-3 font-semibold text-[#3c2f00] transition hover:bg-[#ffda62] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2ca50]">
          Coba lagi
        </button>
      </section>
    </main>
  );
}
