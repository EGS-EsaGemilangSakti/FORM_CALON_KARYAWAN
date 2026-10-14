import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const code = await readFile('apps-script/Code.gs','utf8');
const nikA='0000000000000001', nikB='0000000000000002';
const headers=['Submission ID','NIK','Penempatan','ID PIN Finger'];
const record=(id,nik=nikA,placement='JAT',finger='16')=>[id,nik,placement,finger];
function server(initial=[], revisions=[], legacy=false) {
 const sheets={};
 const sheet=rows=>({getLastRow:()=>rows.length+1,getLastColumn:()=>headers.length,getRange:()=>({getDisplayValues:()=>[headers,...rows]})});
 sheets[legacy?'Data Calon Karyawan':'Calon Karyawan Baru']=sheet(initial);
 sheets[legacy?'Revisi Data Calon Karyawan':'Revisi Data Calon Karyawan Baru']=sheet(revisions);
 const ctx=vm.createContext({SPREADSHEET_ID:'test',SpreadsheetApp:{openById:()=>({getSheetByName:name=>sheets[name]})}});
 vm.runInContext(code,ctx);
 return {ctx,initial,revisions,sheets};
}
test('one initial then two revisions per NIK; repeat initial and third revision rejected',()=>{
 const {ctx,initial,revisions}=server();
 assert.equal(ctx.checkCandidateEligibility({nik:nikA,submissionType:'NEW'}).success,true);
 assert.throws(()=>ctx.checkCandidateEligibility({nik:nikA,submissionType:'REVISION'}),/belum terdaftar/);
 initial.push(record('new'));
 assert.throws(()=>ctx.checkCandidateEligibility({nik:nikA,submissionType:'NEW'}),/sudah terdaftar/);
 for(let i=1;i<=2;i++) { assert.equal(ctx.checkCandidateEligibility({nik:nikA,submissionType:'REVISION'}).success,true); revisions.push(record('revision'+i)); }
 assert.throws(()=>ctx.checkCandidateEligibility({nik:nikA,submissionType:'REVISION'}),/Batas pengisian/);
});
test('finger uniqueness is placement plus finger and excludes the same applicant on revisions',()=>{
 const {ctx}=server([record('a'),record('b',nikB,'JRT','20')]);
 assert.doesNotThrow(()=>ctx.assertCandidateSubmission({nik:nikB,placement:'JRT',fingerPin:'16'},'REVISION'));
 assert.throws(()=>ctx.assertCandidateSubmission({nik:nikB,placement:'JAT',fingerPin:'16'},'REVISION'),/calon karyawan lain/);
 assert.doesNotThrow(()=>ctx.assertCandidateSubmission({nik:nikA,placement:'JAT',fingerPin:'16'},'REVISION'));
 const {ctx:newCtx}=server([record('a')]);
 assert.doesNotThrow(()=>newCtx.assertCandidateSubmission({nik:nikB,placement:'JRT',fingerPin:'16'},'NEW'));
 assert.throws(()=>newCtx.assertCandidateSubmission({nik:nikB,placement:'JAT',fingerPin:'16'},'NEW'),/calon karyawan lain/);
});
test('legacy orphan revisions do not authorize revision; legacy ledgers and previous finger assignments remain checked',()=>{
 const {ctx}=server([], [record('orphan')],true);
 assert.throws(()=>ctx.checkCandidateEligibility({nik:nikA,submissionType:'REVISION'}),/belum terdaftar/);
 assert.equal(ctx.checkCandidateEligibility({nik:nikA,submissionType:'NEW'}).success,true);
 assert.throws(()=>ctx.assertCandidateSubmission({nik:nikB,placement:'JAT',fingerPin:'16'},'NEW'),/calon karyawan lain/);
});
test('preflight checks finger and rejects invalid input without returning employee data',()=>{
 const {ctx}=server([record('a')]);
 assert.throws(()=>ctx.checkCandidateEligibility({nik:'123',submissionType:'NEW'}),/16 digit/);
 assert.throws(()=>ctx.checkCandidateEligibility({nik:nikB,submissionType:'OTHER'}),/Jenis/);
 assert.throws(()=>ctx.checkCandidateEligibility({nik:nikB,submissionType:'NEW',placement:'JAT',fingerPin:'16'}),/calon karyawan lain/);
 const result=ctx.checkCandidateEligibility({nik:nikB,submissionType:'NEW',placement:'JRT',fingerPin:'16'});
 assert.deepEqual(Object.keys(result).sort(),['message','success']);
});
test('final submission rechecks after preflight, while holding lock, before any upload',()=>{
 const {ctx,initial}=server(); let locked=false,uploads=0;
 ctx.validateTimestamp=()=>{};ctx.validatePayload=data=>data;
 ctx.validateBankAccount=()=>({success:true,status:'VALID',score:10});
 ctx.LockService={getScriptLock:()=>({waitLock(){locked=true},releaseLock(){locked=false}})};
 ctx.uploadToDrive=()=>{uploads++;return {url:'test'}};
 ctx.generateUUID=()=> 'id';
 const original=ctx.assertCandidateSubmission;
 ctx.assertCandidateSubmission=(...args)=>{assert.equal(locked,true);return original(...args)};
 assert.equal(ctx.checkCandidateEligibility({nik:nikA,submissionType:'NEW'}).success,true);
 initial.push(record('other-tab'));
 assert.throws(()=>ctx.handleSubmitPayroll({submissionType:'NEW',data:{nik:nikA,placement:'JAT',fingerPin:'16',bank:{}},files:{}}),/sudah terdaftar/);
 assert.equal(uploads,0);assert.equal(locked,false);
});
test('renaming ledgers preserves original sheet instead of creating an empty replacement',()=>{
 let renamed=''; const legacy={setName:name=>{renamed=name;return legacy}};
 const ctx=vm.createContext({SPREADSHEET_ID:'test',SpreadsheetApp:{openById:()=>({getSheetByName:name=>name==='Data Calon Karyawan'?legacy:null,insertSheet:()=>assert.fail('must not create replacement')})}});
 vm.runInContext(code,ctx);
 assert.equal(ctx.getSheet('Calon Karyawan Baru'),legacy);assert.equal(renamed,'Calon Karyawan Baru');
});
test('eligibility rate limits are independent per NIK',()=>{
 const values=new Map();const ctx=vm.createContext({CacheService:{getScriptCache:()=>({get:key=>values.get(key),put:(key,value)=>values.set(key,value)})},Utilities:{base64EncodeWebSafe:value=>value}});vm.runInContext(code,ctx);
 for(let i=0;i<20;i++)ctx.rateLimit('origin','checkCandidateEligibility',nikA);
 assert.throws(()=>ctx.rateLimit('origin','checkCandidateEligibility',nikA),/Terlalu banyak/);
 assert.doesNotThrow(()=>ctx.rateLimit('origin','checkCandidateEligibility',nikB));
});
