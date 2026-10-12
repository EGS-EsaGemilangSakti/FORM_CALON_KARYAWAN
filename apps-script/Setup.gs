// Run once, then run setup() in a fresh execution. Existing resource IDs are reused.
function initializeCandidateStorage() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SPREADSHEET_ID')) props.setProperty('SPREADSHEET_ID', SpreadsheetApp.create('FORM CALON KARYAWAN').getId());
  if (!props.getProperty('UPLOADS_FOLDER_ID')) props.setProperty('UPLOADS_FOLDER_ID', DriveApp.createFolder('FORM_CALON_KARYAWAN_UPLOADS').getId());
  const root = DriveApp.getFolderById(props.getProperty('UPLOADS_FOLDER_ID'));
  const folders = {KTP_FOLDER_ID:'KTP',KK_FOLDER_ID:'KK',SURAT_KUASA_FOLDER_ID:'SURAT_KUASA',PERSONAL_PHOTO_FOLDER_ID:'FOTO_DIRI',DIPLOMA_FOLDER_ID:'IJAZAH',NPWP_FOLDER_ID:'NPWP',BPJS_HEALTH_FOLDER_ID:'BPJS_KESEHATAN',BPJS_EMPLOYMENT_FOLDER_ID:'BPJS_KETENAGAKERJAAN',DOMICILE_LETTER_FOLDER_ID:'SURAT_DOMISILI'};
  Object.keys(folders).forEach(function(key) { if (!props.getProperty(key)) props.setProperty(key, root.createFolder(folders[key]).getId()); });
  props.setProperty('ALLOWED_ORIGINS','https://daftar.ptesagemilangsakti.com');
  console.log('Spreadsheet: https://docs.google.com/spreadsheets/d/' + props.getProperty('SPREADSHEET_ID') + '/edit');
  console.log('Folder: https://drive.google.com/drive/folders/' + props.getProperty('UPLOADS_FOLDER_ID'));
}

function setup() {
  createSpreadsheetHeaders();
  createSpreadsheetHeadersForSheet(getSheet(REVISION_SHEET_NAME));
  createPlacementSheets();
  syncPlacementSheetsFromMain();
  applyDuplicateNikFormattingToPayrollSheets();
  DriveApp.getFolderById(UPLOADS_FOLDER_ID);
  DriveApp.getFolderById(KTP_FOLDER_ID);
  DriveApp.getFolderById(KK_FOLDER_ID);
  DriveApp.getFolderById(SURAT_KUASA_FOLDER_ID);
  DriveApp.getFolderById(PERSONAL_PHOTO_FOLDER_ID);
  DriveApp.getFolderById(DIPLOMA_FOLDER_ID);
  DriveApp.getFolderById(NPWP_FOLDER_ID);
  DriveApp.getFolderById(BPJS_HEALTH_FOLDER_ID);
  DriveApp.getFolderById(BPJS_EMPLOYMENT_FOLDER_ID);
  DriveApp.getFolderById(DOMICILE_LETTER_FOLDER_ID);
  console.log('Setup berhasil: header spreadsheet, sinkronisasi sheet penempatan, format duplikat NIK, dan folder Drive valid.');
}

function createPlacementSheets() {
  PLACEMENTS.forEach(function (placement) {
    createSpreadsheetHeadersForSheet(getSheet(getPlacementSheetName(placement)));
    createSpreadsheetHeadersForSheet(getSheet(getRevisionPlacementSheetName(placement)));
  });
}

function syncPlacementSheetsFromMain() {
  syncSourceSheetIntoPlacementSheets(SHEET_NAME, getPlacementSheetName);
  syncSourceSheetIntoPlacementSheets(REVISION_SHEET_NAME, getRevisionPlacementSheetName);
}

function syncSourceSheetIntoPlacementSheets(sourceSheetName, sheetNameForPlacement) {
  const sourceSheet = getSheet(sourceSheetName);
  createSpreadsheetHeadersForSheet(sourceSheet);
  const lastRow = sourceSheet.getLastRow();
  const rows = lastRow > 1 ? sourceSheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() : [];
  const placementColumnIndex = HEADERS.indexOf('Penempatan');

  PLACEMENTS.forEach(function (placement) {
    const sheet = getSheet(sheetNameForPlacement(placement));
    createSpreadsheetHeadersForSheet(sheet);

    if (sheet.getMaxRows() > 1) {
      sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length).clearContent();
    }

    const placementRows = rows.filter(function (row) {
      return String(row[placementColumnIndex] || '').trim() === placement;
    });

    if (placementRows.length > 0) {
      sheet.getRange(2, 1, placementRows.length, HEADERS.length).setValues(placementRows);
    }
  });
}

function applyDuplicateNikFormattingToPayrollSheets() {
  applyDuplicateNikFormattingToSheet(getSheet(SHEET_NAME));
  applyDuplicateNikFormattingToSheet(getSheet(REVISION_SHEET_NAME));
  PLACEMENTS.forEach(function (placement) {
    applyDuplicateNikFormattingToSheet(getSheet(getPlacementSheetName(placement)));
    applyDuplicateNikFormattingToSheet(getSheet(getRevisionPlacementSheetName(placement)));
  });
}

function applyDuplicateNikFormattingToSheet(sheet) {
  const dataRange = sheet.getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), HEADERS.length);
  const duplicateNikFormula = '=AND($F2<>"",COUNTIF($F:$F,$F2)>1)';

  const preservedRules = sheet.getConditionalFormatRules().filter(function (rule) {
    const condition = rule.getBooleanCondition();
    if (!condition || condition.getCriteriaType() !== SpreadsheetApp.BooleanCriteria.CUSTOM_FORMULA) {
      return true;
    }
    const criteriaValues = condition.getCriteriaValues();
    return criteriaValues[0] !== duplicateNikFormula;
  });

  const duplicateNikRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied(duplicateNikFormula)
    .setBackground('#f4cccc')
    .setFontColor('#990000')
    .setRanges([dataRange])
    .build();

  preservedRules.push(duplicateNikRule);
  sheet.setConditionalFormatRules(preservedRules);
}

function migrateCandidateBpjsSchema() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const props = PropertiesService.getScriptProperties();
    if (!props.getProperty('BPJS_SCHEMA_BACKUP_ID')) {
      const backup = SpreadsheetApp.openById(SPREADSHEET_ID).copy('BACKUP CALON KARYAWAN SEBELUM BPJS ' + new Date().toISOString());
      props.setProperty('BPJS_SCHEMA_BACKUP_ID', backup.getId());
    }
    const names = [SHEET_NAME, REVISION_SHEET_NAME];
    PLACEMENTS.forEach(function(p) { names.push(getPlacementSheetName(p), getRevisionPlacementSheetName(p)); });
    names.forEach(function(name) { createSpreadsheetHeadersForSheet(getSheet(name)); });
    console.log('Migrasi BPJS berhasil: Area dihapus, empat kolom BPJS ditambahkan. Backup tersimpan.');
  } finally { lock.releaseLock(); }
}
