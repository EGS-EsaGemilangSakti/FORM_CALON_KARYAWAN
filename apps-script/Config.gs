const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
const SPREADSHEET_ID = SCRIPT_PROPERTIES.getProperty('SPREADSHEET_ID') || '';
const UPLOADS_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('UPLOADS_FOLDER_ID') || '';
const KTP_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('KTP_FOLDER_ID') || '';
const SURAT_KUASA_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('SURAT_KUASA_FOLDER_ID') || '';
const KK_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('KK_FOLDER_ID') || '';
const PERSONAL_PHOTO_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('PERSONAL_PHOTO_FOLDER_ID') || '';
const DIPLOMA_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('DIPLOMA_FOLDER_ID') || '';
const NPWP_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('NPWP_FOLDER_ID') || '';
const BPJS_HEALTH_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('BPJS_HEALTH_FOLDER_ID') || '';
const BPJS_EMPLOYMENT_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('BPJS_EMPLOYMENT_FOLDER_ID') || '';
const DOMICILE_LETTER_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('DOMICILE_LETTER_FOLDER_ID') || '';
const ALLOWED_ORIGINS = (SCRIPT_PROPERTIES.getProperty('ALLOWED_ORIGINS') || 'https://daftar.ptesagemilangsakti.com').split(',').map(function (origin) {
  return origin.trim();
}).filter(String);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = {
  ktp: ['application/pdf', 'image/jpeg', 'image/png'],
  kartuKeluarga: ['application/pdf', 'image/jpeg', 'image/png'],
  suratKuasa: ['application/pdf', 'image/jpeg', 'image/png'],
  personalPhoto: ['image/jpeg', 'image/png'],
  diploma: ['image/jpeg', 'image/png'],
  npwp: ['image/jpeg', 'image/png'],
  bpjsHealth: ['image/jpeg', 'image/png'],
  bpjsEmployment: ['image/jpeg', 'image/png'],
  domicileLetter: ['image/jpeg', 'image/png']
};
