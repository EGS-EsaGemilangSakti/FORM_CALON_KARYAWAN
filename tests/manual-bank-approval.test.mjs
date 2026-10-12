import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import {build} from 'esbuild';
const helper=await readFile('backend/BankApproval.gs','utf8');
test('manual approval requires bank number and owner; keeps punctuation significant',()=>{
 const account={bank_code:'bank_kesejahteraan_ekonomi',account_number:'000000000001',account_owner:'TEST. ACCOUNT'};
 const ctx=vm.createContext({SCRIPT_PROPERTIES:{getProperty:()=>JSON.stringify([account])},sanitizeInput:s=>s});vm.runInContext(helper,ctx);
 assert.equal(ctx.getManualBankApproval(account).score,10);
 assert.equal(ctx.getManualBankApproval({...account,account_owner:' TEST.  ACCOUNT '}).validationSource,'MANUAL_APPROVAL');
 for(const patch of [{bank_code:'bank_mandiri'},{account_number:'000000000002'},{account_owner:'TEST ACCOUNT'},{account_owner:'OTHER ACCOUNT'}])assert.equal(ctx.getManualBankApproval({...account,...patch}),null);
});
test('full name and account owner accept periods and still reject digits',async()=>{
 const bundle=await build({entryPoints:['src/schemas/payrollSchema.ts'],bundle:true,write:false,platform:'node',format:'esm'});
 const {payrollSchema}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
 const shape=payrollSchema.innerType().shape;
 for(const field of ['fullName','accountOwner']) {assert.equal(shape[field].safeParse('TEST. ACCOUNT').success,true);assert.equal(shape[field].safeParse('TEST123').success,false);}
});
