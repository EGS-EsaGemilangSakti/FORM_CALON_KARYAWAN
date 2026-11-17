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

## Login Google dan rilis backend otomatis

Login sekali pada komputer ini:

```powershell
node rilis.mjs --login-google
node rilis.mjs --check-google
```

Gunakan akun hrd.esagemilangsakti@gmail.com dan setujui izin resmi clasp. Apps Script API harus On di https://script.google.com/home/usersettings . Login hanya meminta scope script.projects, script.deployments dan userinfo.email; tidak meminta akses dokumen Drive atau Cloud Platform. Akun yang berbeda atau belum diverifikasi akan ditolak sebelum deployment.

Alat Google clasp 3.4.1 dipasang di ~/.codex/tools/egs-apps-script . Kredensial named-user egs-release disimpan di ~/.codex/credentials/egs-apps-script/credentials.json, di luar folder repository/OneDrive. Folder kredensial pada komputer ini dibatasi aksesnya ke pemilik akun Windows dan SYSTEM. Jangan mengirim isinya melalui chat atau commit Git. Untuk komputer baru, install: npm install --prefix "$env:USERPROFILE/.codex/tools/egs-apps-script" --save-exact @google/clasp@3.4.1 .

Setelah login, jalankan perintah rilis biasa: node rilis.mjs --message "Jelaskan perubahan". Sumber apps-script/*.gs yang berubah otomatis ikut diterbitkan lebih dahulu; jika tidak berubah, backend tidak dibuatkan versi baru. Refresh token digunakan untuk memperoleh access token baru pada setiap rilis dan identitas HRD diverifikasi ulang. Jika izin dicabut atau token ditolak Google, skrip berhenti dan meminta login ulang; tidak menjanjikan kredensial berlaku selamanya. Untuk memaksa rilis kedua sisi walaupun sumber backend belum berubah, gunakan --with-backend. --frontend-only hanya diizinkan ketika tidak ada perubahan backend. --check tetap hanya menjalankan pemeriksaan lokal. --check-google hanya memeriksa autentikasi, akses project, dan deployment tanpa mengubah Google.

APPS_SCRIPT_ACCESS_TOKEN masih didukung sebagai override proses untuk operator yang sudah memiliki token dengan ketiga scope tersebut. Biasanya variabel ini tidak perlu diisi. EGS_GOOGLE_AUTH_FILE dapat mengubah lokasi kredensial; gunakan folder pribadi di luar repository.

Sumber yang diterbitkan: apps-script/*.gs. Lima repository lama mengabaikan folder ini di Git, sehingga checkout baru tetap dapat merilis frontend, tetapi perlu dilengkapi sumber backend lokal terbaru sebelum memakai --with-backend. Folder backend/ berisi helper/patch, bukan sumber deployment otomatis. Jangan menganggap perubahan file patch sudah mengubah Apps Script; terapkan dahulu ke apps-script/Code.gs. Untuk project calon karyawan, Config+Setup+Code digabung sebagai Code sesuai layout produksi; Repair tetap terpisah. Manifest serta file remote lain dipertahankan. Snapshot isi remote dan konfigurasi deployment disimpan lokal di .git/release-backups/ sebelum update. Review sumber lokal terhadap editor Google sebelum rilis backend agar perubahan manual orang lain tidak tertimpa.

Backend dibuatkan versi baru lalu deployment ID yang sama diperbarui; URL API tetap. Script Properties (ID Drive/Sheets dan API key), data Sheet, folder Drive, serta izin tidak diubah. Skrip tidak menjalankan fungsi setup/migrasi/repair. Jika backend sukses tetapi Pages gagal, backend sudah berubah: skrip melaporkan kegagalan, bukan sukses menyeluruh. Snapshot lokal bisa digunakan untuk pemulihan; tidak ada rollback otomatis atas data.

Status terakhir backend dan lock disimpan di .git/form-release-state.json dan .git/form-release.lock. Jangan menjalankan dua rilis sekaligus; jika proses terputus, pastikan tidak ada rilis aktif sebelum menghapus direktori lock tersebut.

Referensi API resmi: https://developers.google.com/apps-script/api/reference/rest/v1/projects/updateContent dan https://developers.google.com/apps-script/api/reference/rest/v1/projects.deployments/update .
