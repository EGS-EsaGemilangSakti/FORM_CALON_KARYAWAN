# Form Calon Karyawan

Form pendaftaran calon karyawan PT ESA GEMILANG SAKTI, dengan tampilan dasar form Melani.

## Aturan formulir

- Penempatan: JAT, JRT, JST.
- Posisi: BATANGAN/REGULER (satu pilihan).
- Status karyawan: Kontrak.
- Identitas karyawan: ID PIN Finger berupa 1–30 digit; angka nol di awal dipertahankan. Tidak menggunakan ID OPS, OS, atau ID karyawan lain.
- Area tidak digunakan. Status kepemilikan BPJS Kesehatan dan Ketenagakerjaan dipilih terpisah: Sudah Ada mewajibkan nomor; Belum mengosongkan nomor.
- KTP dan KK wajib. Foto diri, ijazah, NPWP, BPJS, dan surat domisili opsional.
- Surat kuasa wajib untuk rekening orang lain.
- Validasi rekening minimal skor 7; server memvalidasi ulang sebelum menyimpan.
- Data baru dan revisi disimpan pada tabel terpisah, termasuk tabel per penempatan. Maksimal dua pengisian per ID PIN Finger mengikuti batas pengisian template.
- Dokumen disiapkan segera setelah dipilih agar tidak perlu dibaca ulang dari penyimpanan perangkat saat submit.

## Pengembangan

Node.js 20 atau lebih baru.

```sh
npm ci
npm test
npm run lint
npm run build
npm run dev
```

Salin `.env.example` ke `.env.local`, isi `VITE_API_URL` dengan URL deployment backend calon karyawan. Jangan gunakan backend form lain.

## Backend Google Apps Script

Kode server yang bebas rahasia ada di `apps-script/`. Gabungkan Config.gs, Setup.gs, dan Code.gs atau simpan sebagai file terpisah di project.

1. Jalankan `initializeCandidateStorage()` satu kali; fungsi ini membuat spreadsheet dan folder Drive khusus dan menyimpan ID di Script Properties. Pemanggilan ulang menggunakan sumber daya yang sudah dibuat.
2. Jalankan `setup()` di eksekusi baru untuk membuat header dan tabel.
3. Isi Script Property `API_CO_ID_KEY` di Google, jangan di Git atau frontend.
4. Deploy sebagai Web app, execute as pemilik project, dapat dipanggil publik. File Drive dan spreadsheet tetap privat.
5. Backend hanya menerima origin `https://daftar.ptesagemilangsakti.com` secara default.

Project: https://script.google.com/home/projects/1QnhOJVgv8CToFKWacI3sneXFMW4IODnuf-qTCP6vnUQ6Hp7SaXa3OP4T/edit

## GitHub Pages

Repository: EGS-EsaGemilangSakti/FORM_CALON_KARYAWAN.
Domain: https://daftar.ptesagemilangsakti.com/.

- Repository variable `VITE_API_URL` berisi URL Web app backend calon karyawan.
- Pages menggunakan GitHub Actions. Push ke main menjalankan tes, lint, build, dan deploy.
- `public/CNAME` berisi domain kustom.
- DNS host `daftar`: CNAME ke `egs-esagemilangsakti.github.io`, tanpa A/AAAA yang bertabrakan.
- Aktifkan Enforce HTTPS setelah sertifikat tersedia.

## Pengujian

Tes mencakup seluruh pilihan kerja, penolakan ID lama, PIN dengan nol di awal, dokumen wajib/opsional, kesesuaian kolom spreadsheet, serta penyiapan file dan spasi saat mengetik. Pengujian server menggunakan layanan tiruan; tidak mengirim data karyawan fiktif ke produksi.
