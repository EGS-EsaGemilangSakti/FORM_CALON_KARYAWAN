# Rilis produksi — Form_Calon_Karyawan

Jalankan dari folder project. Satu perintah ini memeriksa sumber, menjalankan npm ci, seluruh tests/*.test.mjs, lint, build, commit perubahan, push main, menunggu GitHub Pages, lalu memeriksa SHA commit di domain produksi serta kesehatan backend.

```powershell
node rilis.mjs --message "Jelaskan perubahan"
# Alternatif:
npm run rilis -- --message "Jelaskan perubahan"
# Hanya pemeriksaan lokal, tanpa commit/push/deploy:
node rilis.mjs --check
```

Domain: https://daftar.ptesagemilangsakti.com/
Repository: https://github.com/EGS-EsaGemilangSakti/FORM_CALON_KARYAWAN

## Prasyarat

Node.js 20+, npm, Git; branch main. Autentikasi GitHub memakai Git Credential Manager akun EGS-EsaGemilangSakti atau environment GH_TOKEN/GITHUB_TOKEN. Token perlu akses repository, Actions, dan baca repository variables. Gunakan credential manager atau environment proses; jangan tulis token ke repository/argumen perintah. VITE_API_URL sudah dikonfigurasi pada repository.

Skrip berhenti pada konflik, branch tertinggal, kegagalan test/build/API/deployment, atau domain yang belum memuat commit terbaru. Rilis selesai hanya jika muncul PROD VERIFIED. Rilis sebelumnya yang gagal bisa dicoba ulang dengan perintah sama; tidak membuat commit kosong atau force push. Batas tunggu CI 20 menit, publikasi sekitar 7 menit, per request 20–30 detik.

File tracked yang berubah ikut commit; file baru hanya direktori sumber project dan file konfigurasi/dokumentasi yang diizinkan. Arsip pribadi, screenshot root, node_modules, dist, data, serta pola nama secret/token tidak ikut ditambahkan. Tinjau perubahan sebelum menjalankan; ini bukan pemindai rahasia lengkap. File yang telah di-stage sebelumnya ikut commit.

## Apps Script

Rilis GitHub Pages tidak mengubah Apps Script. Skrip mendeteksi perubahan sumber lokal apps-script/*.gs; bila berubah, rilis biasa akan berhenti dan meminta mode backend. Hal ini mencegah klaim prod palsu untuk backend yang belum diterbitkan.

```powershell
# APPS_SCRIPT_ACCESS_TOKEN harus tersedia dalam environment proses.
node rilis.mjs --with-backend --message "Ubah frontend dan backend"
```

Autentikasi Google adalah setup satu kali yang belum tersedia di workspace ini. Aktifkan Apps Script API pada project Cloud kredensial dan akun pengelola di https://script.google.com/home/usersettings . Sediakan access token OAuth akun pemilik yang berwenang dengan scope script.projects dan script.deployments. Token login form/uang makan bukan token untuk rilis Apps Script. Jangan mengirim token melalui chat atau menyimpannya ke Git. Token kedaluwarsa harus diperbarui melalui pengelola OAuth Anda; skrip tidak membuat kredensial baru.

Sumber yang diterbitkan: apps-script/*.gs. Lima repository lama mengabaikan folder ini di Git, sehingga checkout baru tetap dapat merilis frontend, tetapi perlu dilengkapi sumber backend lokal terbaru sebelum memakai --with-backend. Folder backend/ berisi helper/patch, bukan sumber deployment otomatis. Jangan menganggap perubahan file patch sudah mengubah Apps Script; terapkan dahulu ke apps-script/Code.gs. Untuk project calon karyawan, Config+Setup+Code digabung sebagai Code sesuai layout produksi; Repair tetap terpisah. Manifest serta file remote lain dipertahankan. Snapshot isi remote dan konfigurasi deployment disimpan lokal di .git/release-backups/ sebelum update. Review sumber lokal terhadap editor Google sebelum rilis backend agar perubahan manual orang lain tidak tertimpa.

Backend dibuatkan versi baru lalu deployment ID yang sama diperbarui; URL API tetap. Script Properties (ID Drive/Sheets dan API key), data Sheet, folder Drive, serta izin tidak diubah. Skrip tidak menjalankan fungsi setup/migrasi/repair. Jika backend sukses tetapi Pages gagal, backend sudah berubah: skrip melaporkan kegagalan, bukan sukses menyeluruh. Snapshot lokal bisa digunakan untuk pemulihan; tidak ada rollback otomatis atas data.

Status terakhir backend dan lock disimpan di .git/form-release-state.json dan .git/form-release.lock. Jangan menjalankan dua rilis sekaligus; jika proses terputus, pastikan tidak ada rilis aktif sebelum menghapus direktori lock tersebut.

Referensi API resmi: https://developers.google.com/apps-script/api/reference/rest/v1/projects/updateContent dan https://developers.google.com/apps-script/api/reference/rest/v1/projects.deployments/update .
