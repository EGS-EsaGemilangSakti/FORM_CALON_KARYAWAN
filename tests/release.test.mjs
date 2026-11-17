import assert from 'node:assert/strict';
import test from 'node:test';
import {repositoryFromUrl,selectRun,isSafeNewFile,buildGoogleFiles,readPublishedRevision} from '../rilis.mjs';
test('release accepts GitHub remotes and rejects lookalike hosts',()=>{
 assert.equal(repositoryFromUrl('https://github.com/owner/repo.git'),'owner/repo');
 assert.equal(repositoryFromUrl('git@github.com:owner/repo.git'),'owner/repo');
 for(const remote of ['https://github.com.evil.com/o/r','https://evil.com/o/r','https://github.com/o/../r'])assert.throws(()=>repositoryFromUrl(remote));
});
test('release never accepts an older workflow or another commit/branch',()=>{
 const runs=[{id:1,head_sha:'abc',head_branch:'main',created_at:'2026-01-01'},{id:2,head_sha:'other',head_branch:'main',created_at:'2026-02-01'},{id:3,head_sha:'abc',head_branch:'topic',created_at:'2026-02-01'},{id:4,head_sha:'abc',head_branch:'main',created_at:'2026-02-01'}];
 assert.equal(selectRun(runs,'abc',Date.parse('2026-01-15')).id,4);
 assert.equal(selectRun(runs.slice(0,3),'abc',Date.parse('2026-01-15')),undefined);
});
test('release excludes private archives, credentials and generated output while keeping project sources',()=>{
 for(const file of ['data.zip','screenshots.png','.env','secrets/oauth.json','src/client_secret.json','dist/index.html','src/../secrets.json'])assert.equal(isSafeNewFile(file),false,file);
 for(const file of ['src/App.tsx','tests/form.test.mjs','public/logo.svg','.github/workflows/deploy-pages.yml','rilis.mjs','RILIS.md'])assert.equal(isSafeNewFile(file),true,file);
});
test('GAS release preserves remote manifest and unrelated files and updates only intended sources',()=>{
 const remote=[{name:'appsscript',type:'JSON',source:'{manifest}'},{name:'Code',type:'SERVER_JS',source:'old'},{name:'Other',type:'SERVER_JS',source:'untouched'}];
 const files=buildGoogleFiles(remote,{Code:'new',Config:'config',Setup:'setup'},false);
 assert.equal(files.find(f=>f.name==='Code').source,'new');assert.equal(files.find(f=>f.name==='Other').source,'untouched');
 assert.equal(files.find(f=>f.name==='appsscript').source,'{manifest}');assert.equal(remote[1].source,'old');
 const bundled=buildGoogleFiles(remote,{Code:'code',Config:'config',Setup:'setup',Repair:'repair'},true);
 assert.equal(bundled.find(f=>f.name==='Code').source,'config\n\nsetup\n\ncode');
 assert.equal(bundled.filter(f=>f.name==='Config').length,0);assert.equal(bundled.find(f=>f.name==='Repair').source,'repair');
 assert.throws(()=>buildGoogleFiles([],{Code:'x'},false),/Manifest/);
});
test('production verification requires valid JSON with an exact commit',async()=>{
 const original=globalThis.fetch;
 try {
  globalThis.fetch=async()=>new Response('<html>old page</html>');assert.equal(await readPublishedRevision('https://example.com'),null);
  globalThis.fetch=async()=>new Response(JSON.stringify({commit:'abc'}));assert.equal(await readPublishedRevision('https://example.com'),'abc');
  globalThis.fetch=async()=>new Response('missing',{status:404});assert.equal(await readPublishedRevision('https://example.com'),null);
 } finally {globalThis.fetch=original;}
});

test('GAS release preserves the historical Driver Confing filename without duplicate globals',()=>{
 const remote=[{name:'appsscript',type:'JSON',source:'{}'},{name:'Confing',type:'SERVER_JS',source:'old'}];
 const files=buildGoogleFiles(remote,{Config:'new config'},false);
 assert.equal(files.find(f=>f.name==='Confing').source,'new config');
 assert.equal(files.some(f=>f.name==='Config'),false);
});
