# Persetujuan rekening manual

BankApproval.gs menyediakan getManualBankApproval(payload). Gabungkan fungsi ini ke project Apps Script dan panggil setelah validasi format bank, nomor, dan nama, sebelum provider eksternal:

```js
const manualApproval = getManualBankApproval(payload);
if (manualApproval) return manualApproval;
```

Daftar persetujuan berada pada Script Property APPROVED_BANK_ACCOUNTS berupa JSON array dengan bank_code, account_number (string), dan account_owner. Ketiganya wajib cocok. Kapital dan spasi dinormalisasi; titik tetap signifikan. Rekening lain mengikuti validasi provider dan pengecualian lama yang telah disetujui. Hasil manual ditandai MANUAL_APPROVAL dengan score 10. Jangan simpan data rekening asli di repository.

Validasi nama lengkap dan pemilik rekening pada frontend/backend menerima huruf kapital, spasi, dan titik.

## Bypass seluruh rekening

Script Property `BYPASS_BANK_PROVIDER=true` menerima semua rekening yang lolos pemeriksaan format tanpa menghubungi provider. Respons memiliki score 10 dan validationSource BYPASS_PROVIDER. Sheet menyimpan Status Rekening BYPASS_PROVIDER. Ubah properti ke false untuk mengembalikan pemeriksaan provider dan persetujuan khusus.
