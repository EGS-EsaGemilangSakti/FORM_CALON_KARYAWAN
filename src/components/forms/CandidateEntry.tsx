import { useState } from 'react';
import { checkCandidateEligibility } from '../../services/api';
import { inputClass } from '../fields/FieldShell';

export type CandidateEntryValue = { nik: string; submissionType: 'NEW' | 'REVISION' };

export function CandidateEntry({ initialNik, onContinue }: { initialNik: string; onContinue: (value: CandidateEntryValue) => void }) {
  const [nik, setNik] = useState(initialNik);
  const [submissionType, setSubmissionType] = useState<'NEW' | 'REVISION'>('NEW');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const check = async () => {
    if (busy) return;
    if (!/^\d{16}$/.test(nik)) { setError('NIK wajib 16 digit angka'); return; }
    setBusy(true); setError('');
    try {
      const result = await checkCandidateEligibility(nik, submissionType);
      if (!result.success) throw new Error(result.message);
      onContinue({ nik, submissionType });
    } catch (err) { setError(err instanceof Error ? err.message : 'Pemeriksaan NIK gagal. Silakan coba lagi.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-5 px-5 py-8 sm:px-8">
    <h2 className="text-2xl font-semibold">Mulai Pengisian</h2>
    <p>Pendaftaran awal wajib dilakukan satu kali. Setelah terdaftar, Anda dapat mengirim revisi maksimal dua kali dengan NIK yang sama.</p>
    <label className="block">Jenis Pengisian
      <select className={inputClass} value={submissionType} disabled={busy} onChange={event => { setSubmissionType(event.target.value as 'NEW' | 'REVISION'); setError(''); }}>
        <option value="NEW">Calon Karyawan Baru</option>
        <option value="REVISION">Revisi Data Calon Karyawan Baru</option>
      </select>
    </label>
    <label className="block">NIK
      <input className={inputClass} value={nik} disabled={busy} inputMode="numeric" maxLength={16} autoComplete="off" onChange={event => { setNik(event.target.value.replace(/\D/g, '')); setError(''); }} />
    </label>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <button type="button" disabled={busy} onClick={() => void check()} className="rounded-xl bg-[#f2ca50] px-5 py-3 font-bold text-[#3c2f00] disabled:opacity-50">{busy ? 'Memeriksa NIK...' : 'Periksa NIK dan Lanjut'}</button>
  </section>;
}
