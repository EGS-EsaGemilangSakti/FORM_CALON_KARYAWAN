export type ReportType = 'bank' | 'other';

export interface SupportReport {
  type: ReportType;
  description: string;
  accountOwner: string;
  bankName: string;
  accountNumber: string;
}

export function buildSupportReportUrl(report: SupportReport, formName: string): string {
  const description = report.description.trim();
  if (!description) throw new Error('Deskripsi kendala wajib diisi.');
  if (description.length > 1000) throw new Error('Deskripsi maksimal 1.000 karakter.');

  const lines = ['Halo, saya ingin melaporkan kendala.', '', `Form: ${formName}`];
  if (report.type === 'bank') {
    const owner = report.accountOwner.trim();
    const bank = report.bankName.trim();
    const number = report.accountNumber.trim();
    if (!owner || !bank || !/^\d{5,30}$/.test(number)) {
      throw new Error('Lengkapi nama pemilik, bank, dan nomor rekening (5–30 digit).');
    }
    lines.push('Tipe: Validasi Rekening', `Nama pemilik rekening: ${owner}`, `Bank: ${bank}`, `Nomor rekening: ${number}`);
  } else if (report.type === 'other') {
    lines.push('Tipe: Lainnya');
  } else {
    throw new Error('Pilih tipe kendala.');
  }
  lines.push('', 'Deskripsi kendala:', description);
  return `https://wa.me/6285710840402?text=${encodeURIComponent(lines.join('\n'))}`;
}
