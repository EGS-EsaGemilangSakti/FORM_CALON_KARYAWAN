# Persetujuan rekening manual

BankApproval.gs menyediakan getManualBankApproval(payload). Gabungkan fungsi ini ke project Apps Script dan panggil setelah validasi format bank, nomor, dan nama, sebelum provider eksternal:

```js
const manualApproval = getManualBankApproval(payload);
if (manualApproval) return manualApproval;
```

Daftar persetujuan berada pada Script Property APPROVED_BANK_ACCOUNTS berupa JSON array dengan bank_code, account_number (string), dan account_owner. Ketiganya wajib cocok. Kapital dan spasi dinormalisasi; titik tetap signifikan. Rekening lain mengikuti validasi provider dan pengecualian lama yang telah disetujui. Hasil manual ditandai MANUAL_APPROVAL dengan score 10. Jangan simpan data rekening asli di repository.

Validasi nama lengkap dan pemilik rekening pada frontend/backend menerima huruf kapital, spasi, dan titik.
