import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {readGoogleCredential,refreshGoogleCredential,validateGoogleAccount,appsScriptRequest,GOOGLE_SCOPES} from '../google-auth.mjs';
test('Google login requires named authorized-user refresh credentials; missing login never exposes file contents',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'egs-auth-test-'));const file=path.join(dir,'auth.json');
 try {
 assert.throws(()=>readGoogleCredential(file),/--login-google/);
 fs.writeFileSync(file,JSON.stringify({tokens:{default:{client_id:'other',client_secret:'NEVER_PRINT',refresh_token:'NEVER_PRINT',type:'authorized_user'}}}));assert.throws(()=>readGoogleCredential(file),/tidak lengkap/);
 fs.writeFileSync(file,JSON.stringify({tokens:{'egs-release':{client_id:'test',client_secret:'dummy',refresh_token:'dummy',type:'authorized_user'}}}));assert.equal(readGoogleCredential(file).client_id,'test');
 } finally {fs.unlinkSync(file);fs.rmdirSync(dir);}
});
test('refresh sends credentials only to Google token endpoint and never echoes Google error bodies',async()=>{
 const c={client_id:'id',client_secret:'SECRET',refresh_token:'REFRESH'};
 const token=await refreshGoogleCredential(c,async(url,options)=>{assert.equal(url,'https://oauth2.googleapis.com/token');assert.equal(options.method,'POST');assert.equal(options.body.get('refresh_token'),'REFRESH');return new Response(JSON.stringify({access_token:'access'}));});assert.equal(token,'access');
 await assert.rejects(refreshGoogleCredential(c,async()=>new Response('SECRET REFRESH',{status:400})),e=>e.message.includes('HTTP 400')&&!e.message.includes('SECRET')&&!e.message.includes('REFRESH'));
 await assert.rejects(refreshGoogleCredential(c,async()=>new Response('{}')),/access token/);
});
test('release identity must be verified HRD and authentication scopes exclude Drive document access',async()=>{
 assert.equal(await validateGoogleAccount('dummy',async()=>new Response(JSON.stringify({email:'hrd.esagemilangsakti@gmail.com',verified_email:true}))),'hrd.esagemilangsakti@gmail.com');
 for(const user of [{email:'other@gmail.com',verified_email:true},{email:'hrd.esagemilangsakti@gmail.com',verified_email:false}])await assert.rejects(validateGoogleAccount('dummy',async()=>new Response(JSON.stringify(user))),/akun Google HRD/);
 assert.equal(GOOGLE_SCOPES.length,3);assert.equal(GOOGLE_SCOPES.some(s=>s.includes('/drive')||s.includes('cloud-platform')),false);
});

test('Google API retries transient reads but never blindly retries deployment mutations',async()=>{
 let reads=0;const result=await appsScriptRequest({scriptId:'test'},'dummy','/content','GET',undefined,async()=>++reads===1?new Response('temporary',{status:503}):new Response('{"files":[]}'));assert.equal(reads,2);assert.deepEqual(result,{files:[]});
 let writes=0;await assert.rejects(appsScriptRequest({scriptId:'test'},'dummy','/versions','POST',{},async()=>{writes++;return new Response('temporary',{status:503})}),/HTTP 503/);assert.equal(writes,1);
});
