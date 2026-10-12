import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import { build } from 'esbuild';
const bundled = await build({entryPoints:['src/schemas/payrollSchema.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {payrollSchema}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
globalThis.FileList=class {constructor(files=[]){this.files=files;this.length=files.length}item(i){return this.files[i]??null}};
const file=()=>new FileList([{name:'fixture.pdf',type:'application/pdf',size:100}]);
const fixture={email:'qa@example.com',fullName:'TEST CALON',address:'ALAMAT PENGUJIAN FORM',addressDetail:'ALAMAT TEST',provinceCode:'31',provinceName:'DKI JAKARTA',regencyCode:'3171',regencyName:'JAKARTA SELATAN',districtCode:'317101',districtName:'TEST',villageCode:'3171011001',villageName:'TEST',postalCode:'12345',nik:'0000000000000001',birthPlaceCode:'3171',birthPlace:'JAKARTA SELATAN',birthPlaceProvince:'DKI JAKARTA',birthDate:'2000-01-01',gender:'Laki-laki',maritalStatus:'Belum Menikah',religion:'Islam',ptkpCode:'tk0',phone:'080000000001',motherName:'IBU TEST',emergencyContact:'080000000002',emergencyContactName:'KONTAK TEST',emergencyRelationship:'Ibu',placement:'JAT',fingerPin:'001234',bpjsHealthStatus:'Belum',bpjsHealthNumber:'',bpjsEmploymentStatus:'Belum',bpjsEmploymentNumber:'',employmentStatus:'Kontrak',position:'BATANGAN/REGULER',firstWorkDate:'2026-10-12',bankCode:'bank_mandiri',bankName:'MANDIRI',accountNumber:'0000012345',accountOwner:'TEST CALON',accountValidation:{status:'VALID',score:10,validatedName:'TEST CALON',validationTimestamp:new Date().toISOString(),message:'Test'},ownershipStatus:'PRIBADI',ktpFile:file(),familyCardFile:file(),dataAgreement:true,formStartedAt:new Date(Date.now()-60000).toISOString()};
const ctx=vm.createContext({console});
vm.runInContext(await readFile('apps-script/Code.gs','utf8'),ctx);
const serverData=(data=fixture)=>{const {bankCode,bankName,ktpFile,familyCardFile,dataAgreement,...rest}=data;return {...rest,birthDate:'01-01-2000',firstWorkDate:'12-10-2026',bank:{bank_code:bankCode,bank_name:bankName}}};
test('all three placements accept only configured status and position',()=>{for(const placement of ['JAT','JRT','JST']){assert.equal(payrollSchema.safeParse({...fixture,placement}).success,true);assert.equal(ctx.validatePayload(serverData({...fixture,placement})).fingerPin,'001234');}for(const patch of [{placement:'SHOPEE EXPRESS'},{position:'Driver'},{employmentStatus:'Daily Worker'},{fingerPin:''},{fingerPin:'ABC'}]){assert.equal(payrollSchema.safeParse({...fixture,...patch}).success,false);assert.throws(()=>ctx.validatePayload(serverData({...fixture,...patch})));}});
test('KTP and KK are mandatory; other documents are optional',()=>{assert.equal(payrollSchema.safeParse(fixture).success,true);for(const field of ['ktpFile','familyCardFile'])assert.equal(payrollSchema.safeParse({...fixture,[field]:new FileList()}).success,false);assert.equal(payrollSchema.safeParse({...fixture,personalPhotoFile:new FileList([{type:'text/plain',size:10,name:'bad.txt'}])}).success,false);});
test('old employee IDs are rejected by server',()=>{for(const field of ['opsId','osId','employeeId','area'])assert.throws(()=>ctx.validatePayload({...serverData(),[field]:'123'}));});
test('spreadsheet row aligns and preserves leading-zero PIN',()=>{const headers=vm.runInContext('HEADERS',ctx),data=ctx.validatePayload(serverData());const row=ctx.buildSubmissionRow('qa',data,fixture.accountValidation,'ktp','','kk',{},'NEW');assert.equal(row.length,headers.length);assert.equal(row[headers.indexOf('ID PIN Finger')],"'001234");assert.equal(headers.includes('ID OPS'),false);assert.equal(headers.includes('ID OS'),false);});
test('server requires KTP and KK and routes optional documents without required legacy branches',()=>{let saved=false;ctx.validateTimestamp=()=>{};ctx.validateBankAccount=()=>({success:true,status:'VALID',score:10});ctx.LockService={getScriptLock:()=>({waitLock(){},releaseLock(){}})};ctx.assertFingerSubmissionLimit=()=>{};ctx.generateUUID=()=> 'test';ctx.uploadToDrive=(payload,type)=>{if(!payload)throw Error('File required '+type);return {url:type}};ctx.uploadOptionalToDrive=()=>'';ctx.saveToSpreadsheet=()=>{saved=true};ctx.logSubmission=()=>{};const payload={data:serverData(),submissionType:'NEW',files:{ktp:{},familyCard:{}}};assert.equal(ctx.handleSubmitPayroll(payload).success,true);assert.equal(saved,true);for(const missing of ['ktp','familyCard']){const files={...payload.files};delete files[missing];assert.throws(()=>ctx.handleSubmitPayroll({...payload,files}));}});

for (const kind of ['Health','Employment']) test('BPJS '+kind+' conditional numbers and leading zeros',()=>{
  const status='bpjs'+kind+'Status', number='bpjs'+kind+'Number';
  for(const patch of [{[status]:''},{[status]:'Sudah Ada',[number]:''},{[status]:'Sudah Ada',[number]:'ABC'}]){
    assert.equal(payrollSchema.safeParse({...fixture,...patch}).success,false);
    assert.throws(()=>ctx.validatePayload(serverData({...fixture,...patch})));
  }
  const data=ctx.validatePayload(serverData({...fixture,[status]:'Sudah Ada',[number]:'00123456789'}));
  assert.equal(payrollSchema.safeParse({...fixture,[status]:'Sudah Ada',[number]:'00123456789'}).success,true);
  const headers=vm.runInContext('HEADERS',ctx),row=ctx.buildSubmissionRow('qa',data,fixture.accountValidation,'ktp','','kk',{},'NEW');
  assert.equal(row[headers.indexOf('Nomor BPJS '+(kind==='Health'?'Kesehatan':'Ketenagakerjaan'))],"'00123456789");
  assert.equal(ctx.validatePayload(serverData({...fixture,[status]:'Belum',[number]:'123'}))[number],'');
  assert.equal(headers.includes('Area'),false);
});

test('names allow periods in frontend and backend',()=>{const input={...fixture,fullName:'TEST. CALON',accountOwner:'TEST. CALON'};assert.equal(payrollSchema.safeParse(input).success,true);assert.equal(ctx.validatePayload(serverData(input)).fullName,'TEST. CALON');});
test('manual approval matches bank, number and owner; all other accounts use provider',async()=>{
 const account={bank_code:'bank_kesejahteraan_ekonomi',account_number:'000000000001',account_owner:'TEST CALON'};
 let providerCalls=0;
 const sandbox=vm.createContext({SCRIPT_PROPERTIES:{getProperty:key=>key==='APPROVED_BANK_ACCOUNTS'?JSON.stringify([account]):'test-key'},UrlFetchApp:{fetch:()=>{providerCalls++;return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({data:{is_valid:false,score:0}})}}}});
 vm.runInContext(await readFile('apps-script/Code.gs','utf8'),sandbox);
 const request={...account,bank_name:'seabank/bank bke'};
 assert.equal(sandbox.validateBankAccount(request).score,10);assert.equal(providerCalls,0);
 for(const patch of [{bank_code:'bank_mandiri'},{account_number:'000000000002'},{account_owner:'OTHER OWNER'}])assert.equal(sandbox.validateBankAccount({...request,...patch}).score,0);
 assert.equal(providerCalls,3);
});
