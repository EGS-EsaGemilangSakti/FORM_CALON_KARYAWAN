// Administrative repair. Run inspectCandidateLegacyData before repairCandidateLegacyData.
// No public API route calls these functions.
function planCandidateLegacyRepair(initial, revisions) {
  const initialNiks = {};
  initial.forEach(function(r) { initialNiks[r.nik] = true; });
  const groups = {};
  revisions.forEach(function(r) {
    if (!initialNiks[r.nik]) (groups[r.nik] || (groups[r.nik] = [])).push(r);
  });
  const moves = [];
  const issues = [];
  Object.keys(groups).forEach(function(nik) {
    const rows = groups[nik];
    if (!/^\d{16}$/.test(nik) || rows.some(function(r) { return !isFinite(r.time); })) {
      rows.forEach(function(r) { issues.push({record:r, reason:'NIK atau waktu tidak valid; periksa pendaftaran awal secara manual'}); });
      return;
    }
    rows.sort(function(a,b) { return a.time - b.time || a.row - b.row; });
    moves.push(rows[0]);
  });
  const movedRows = {};
  moves.forEach(function(r) { movedRows[r.row] = true; });
  const remaining = revisions.filter(function(r) { return !movedRows[r.row]; });
  const allInitial = initial.concat(moves);
  const byNik = {};
  allInitial.forEach(function(r) { const g=byNik[r.nik] || (byNik[r.nik]={initial:[],revision:[]});g.initial.push(r); });
  remaining.forEach(function(r) { const g=byNik[r.nik] || (byNik[r.nik]={initial:[],revision:[]});g.revision.push(r); });
  Object.keys(byNik).forEach(function(nik) {
    const g=byNik[nik];
    if (g.initial.length > 1) g.initial.forEach(function(r) { issues.push({record:r,reason:'Lebih dari satu pendaftaran awal untuk NIK yang sama'}); });
    if (g.revision.length > 2 || g.initial.length + g.revision.length > 3) g.initial.concat(g.revision).forEach(function(r) { issues.push({record:r,reason:'Riwayat melebihi 1 pendaftaran awal dan 2 revisi; jangan tambah pengisian'}); });
  });
  const pins={};
  initial.concat(revisions).forEach(function(r) {
    if (!r.placement || !r.finger) { issues.push({record:r,reason:'Penempatan atau ID Finger kosong'});return; }
    const key=JSON.stringify([r.placement,r.finger]);
    (pins[key] || (pins[key]=[])).push(r);
  });
  Object.keys(pins).forEach(function(key) {
    const rows=pins[key]; const niks={};rows.forEach(function(r){niks[r.nik]=true;});
    if(Object.keys(niks).length>1) rows.forEach(function(r){issues.push({record:r,reason:'Bentrok Penempatan + ID Finger pada NIK berbeda'});});
  });
  return {moves:moves,issues:issues,initialCount:initial.length,revisionCount:revisions.length};
}

function readLegacyRepairRows(sheet) {
  const last=sheet.getLastRow();
  if(last<2)return [];
  const range=sheet.getRange(1,1,last,sheet.getLastColumn());
  const raw=range.getValues(),display=range.getDisplayValues(),headers=display[0];
  const index={};['Submission ID','Created At','NIK','Penempatan','ID PIN Finger'].forEach(function(h){index[h]=headers.indexOf(h);if(index[h]<0)throw new Error('Kolom tidak ditemukan: '+h);});
  return raw.slice(1).map(function(row,i){
    const text=display[i+1],date=row[index['Created At']];
    return {sheet:sheet.getName(),row:i+2,id:text[index['Submission ID']],nik:text[index.NIK].trim(),placement:text[index.Penempatan].trim(),finger:text[index['ID PIN Finger']].trim(),time:date instanceof Date?date.getTime():NaN};
  }).filter(function(r){return r.id || r.nik;});
}

function inspectCandidateLegacyData() {
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
  const initial=ss.getSheetByName(SHEET_NAME),revision=ss.getSheetByName(REVISION_SHEET_NAME);
  if(!initial || !revision)throw new Error('Sheet utama tidak ditemukan');
  const plan=planCandidateLegacyRepair(readLegacyRepairRows(initial),readLegacyRepairRows(revision));
  console.log(JSON.stringify({initialRows:plan.initialCount,revisionRows:plan.revisionCount,orphanNiksToPromote:plan.moves.length,reviewItems:plan.issues.length}));
}

function repairCandidateLegacyData() {
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  const props=PropertiesService.getScriptProperties();
  try {
    if(props.getProperty('LEGACY_REPAIR_RUNNING'))throw new Error('Perbaikan sebelumnya belum selesai. Periksa backup dan log sebelum melanjutkan.');
    const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
    const initial=ss.getSheetByName(SHEET_NAME),revision=ss.getSheetByName(REVISION_SHEET_NAME);
    if(!initial || !revision)throw new Error('Sheet utama tidak ditemukan');
    const initialRows=readLegacyRepairRows(initial),revisionRows=readLegacyRepairRows(revision);
    const plan=planCandidateLegacyRepair(initialRows,revisionRows);
    const stamp=Utilities.formatDate(new Date(),'Asia/Jakarta','yyyyMMdd-HHmmss');
    const backup=ss.copy('BACKUP CALON KARYAWAN SEBELUM PERAPIHAN '+stamp);
    props.setProperty('LEGACY_REPAIR_BACKUP_ID',backup.getId());
    props.setProperty('LEGACY_REPAIR_RUNNING',stamp);
    const log=ss.insertSheet('Log Perapihan '+stamp);
    log.appendRow(['Waktu','Submission ID','NIK','Sheet Asal','Baris Asal','Tindakan','Backup']);
    // Copy the original cells (including number formats and document links).
    plan.moves.sort(function(a,b){return b.row-a.row;}).forEach(function(record){
      const targetRow=initial.getLastRow()+1;
      if(targetRow>initial.getMaxRows())initial.insertRowsAfter(initial.getMaxRows(),targetRow-initial.getMaxRows());
      revision.getRange(record.row,1,1,HEADERS.length).copyTo(initial.getRange(targetRow,1,1,HEADERS.length));
      SpreadsheetApp.flush();
      const original=revision.getRange(record.row,1,1,HEADERS.length).getDisplayValues()[0];
      const copied=initial.getRange(targetRow,1,1,HEADERS.length).getDisplayValues()[0];
      if(JSON.stringify(original)!==JSON.stringify(copied))throw new Error('Verifikasi salinan baris gagal; data sumber belum dihapus');
      log.appendRow([new Date(),record.id,"'"+record.nik,record.sheet,record.row,'Dipindahkan menjadi pendaftaran awal',backup.getUrl()]);
      revision.deleteRow(record.row);
    });
    const afterInitial=readLegacyRepairRows(initial),afterRevision=readLegacyRepairRows(revision);
    if(afterInitial.length+afterRevision.length!==initialRows.length+revisionRows.length)throw new Error('Jumlah data tidak sesuai; periksa backup');
    // Rebuild placement copies directly from source cells to preserve text IDs.
    [[initial,getPlacementSheetName],[revision,getRevisionPlacementSheetName]].forEach(function(pair){
      PLACEMENTS.forEach(function(placement){
        const target=getSheet(pair[1](placement));createSpreadsheetHeadersForSheet(target);
        if(target.getMaxRows()>1)target.getRange(2,1,target.getMaxRows()-1,HEADERS.length).clearContent();
        const records=(pair[0]===initial?afterInitial:afterRevision).filter(function(r){return r.placement===placement;});
        if(records.length+1>target.getMaxRows())target.insertRowsAfter(target.getMaxRows(),records.length+1-target.getMaxRows());
        records.forEach(function(r,i){pair[0].getRange(r.row,1,1,HEADERS.length).copyTo(target.getRange(i+2,1,1,HEADERS.length));});
      });
    });
    const reviewPlan=planCandidateLegacyRepair(afterInitial,afterRevision);
    const report=ss.insertSheet('Periksa HRD '+stamp);
    report.appendRow(['Masalah','NIK','Penempatan','ID Finger','Submission ID','Sheet','Baris']);
    reviewPlan.issues.forEach(function(item){const r=item.record;report.appendRow([item.reason,"'"+r.nik,r.placement,"'"+r.finger,r.id,r.sheet,r.row]);});
    report.setFrozenRows(1);log.setFrozenRows(1);
    applyDuplicateNikFormattingToPayrollSheets();
    SpreadsheetApp.flush();
    props.deleteProperty('LEGACY_REPAIR_RUNNING');
    props.setProperty('LEGACY_REPAIR_COMPLETED',stamp);
    console.log(JSON.stringify({backup:backup.getUrl(),promoted:plan.moves.length,initialRows:afterInitial.length,revisionRows:afterRevision.length,reviewItems:reviewPlan.issues.length,reviewSheet:report.getName(),logSheet:log.getName()}));
  }finally{lock.releaseLock();}
}

function verifyCandidateLegacyRepair() {
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty('LEGACY_REPAIR_RUNNING'))throw new Error('Perapihan masih berjalan atau belum selesai');
  const stamp=props.getProperty('LEGACY_REPAIR_COMPLETED');
  const backupId=props.getProperty('LEGACY_REPAIR_BACKUP_ID');
  if(!stamp || !backupId)throw new Error('Hasil perapihan belum tersedia');
  const ss=SpreadsheetApp.openById(SPREADSHEET_ID),backup=SpreadsheetApp.openById(backupId);
  function rows(book,name) {const s=book.getSheetByName(name);return s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,HEADERS.length).getDisplayValues().filter(function(r){return r[0]||r[5];});}
  function signatures(values){return values.map(function(r){return JSON.stringify(r);}).sort();}
  const before=rows(backup,SHEET_NAME).concat(rows(backup,REVISION_SHEET_NAME));
  const initial=rows(ss,SHEET_NAME),revisions=rows(ss,REVISION_SHEET_NAME),after=initial.concat(revisions);
  const current=signatures(after),expected=signatures(before);
  // Concurrent submissions after repair may add rows; every original row must still exist unchanged.
  expected.forEach(function(value){const i=current.indexOf(value);if(i<0)throw new Error('Baris asli tidak ditemukan atau berubah');current.splice(i,1);});
  const placementIndex=HEADERS.indexOf('Penempatan');
  [[initial,getPlacementSheetName],[revisions,getRevisionPlacementSheetName]].forEach(function(pair){PLACEMENTS.forEach(function(p){
    const source=signatures(pair[0].filter(function(r){return r[placementIndex]===p;}));
    if(JSON.stringify(source)!==JSON.stringify(signatures(rows(ss,pair[1](p)))))throw new Error('Salinan penempatan tidak sesuai: '+pair[1](p));
  });});
  const plan=planCandidateLegacyRepair(readLegacyRepairRows(ss.getSheetByName(SHEET_NAME)),readLegacyRepairRows(ss.getSheetByName(REVISION_SHEET_NAME)));
  const reasons={};plan.issues.forEach(function(x){reasons[x.reason]=(reasons[x.reason]||0)+1;});
  console.log(JSON.stringify({verifiedOriginalRows:before.length,currentRows:after.length,newRowsSinceBackup:current.length,remainingOrphanNiks:plan.moves.length,placementCopiesVerified:true,reviewReasons:reasons,backup:backup.getUrl(),reviewUrl:ss.getUrl()+'#gid='+ss.getSheetByName('Periksa HRD '+stamp).getSheetId()}));
}
