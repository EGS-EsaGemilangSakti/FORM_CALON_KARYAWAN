// Approved accounts belong in private Script Properties, never in source control.
function getManualBankApproval(payload) {
  const approved = JSON.parse(SCRIPT_PROPERTIES.getProperty('APPROVED_BANK_ACCOUNTS') || '[]');
  if (!Array.isArray(approved)) throw new Error('Konfigurasi persetujuan rekening tidak valid');
  const normalizeOwner = function(value) { return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase(); };
  const match = approved.find(function(item) {
    return item && item.bank_code === payload.bank_code && item.account_number === String(payload.account_number)
      && normalizeOwner(item.account_owner) === normalizeOwner(payload.account_owner);
  });
  if (!match) return null;
  return {
    success: true, message: 'Rekening disetujui melalui verifikasi manual', status: 'VALID', score: 10,
    validatedName: sanitizeInput(match.account_owner), validationTimestamp: new Date().toISOString(),
    validationSource: 'MANUAL_APPROVAL'
  };
}
