export const GENDERS = ['Laki-laki', 'Perempuan'] as const;
export const MARITAL_STATUSES = ['Menikah', 'Belum Menikah', 'Cerai Hidup', 'Cerai Mati'] as const;
export const RELIGIONS = ['Islam', 'Kristen', 'Protestan', 'Hindu', 'Buddha', 'Khonghucu'] as const;
export const PTKP_CODES = ['tk0', 'k1', 'k2', 'k3', 'tk1', 'tk2', 'tk3'] as const;

export const PTKP_LABELS: Record<(typeof PTKP_CODES)[number], string> = {
  tk0: 'Belum memiliki anak',
  tk1: 'Cerai memiliki anak 1',
  tk2: 'Cerai memiliki anak 2',
  tk3: 'Cerai memiliki anak 3',
  k1: 'Kawin memiliki anak 1',
  k2: 'Kawin memiliki anak 2',
  k3: 'Kawin memiliki anak 3',
};
