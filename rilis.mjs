import { getAppsScriptAccessToken, appsScriptRequest, loginGoogle } from './google-auth.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CONFIG = {
  "name": "Form_Calon_Karyawan",
  "repo": "EGS-EsaGemilangSakti/FORM_CALON_KARYAWAN",
  "siteUrl": "https://daftar.ptesagemilangsakti.com/",
  "backendUrl": "https://script.google.com/macros/s/AKfycbzkzSH9OfYlLsESRTtSX6rSl70ZU5O-CbnooQ_FUm78K4bGSorQBJ_9Uky0-rkzx_w/exec",
  "scriptId": "1QnhOJVgv8CToFKWacI3sneXFMW4IODnuf-qTCP6vnUQ6Hp7SaXa3OP4T",
  "deploymentId": "AKfycbzkzSH9OfYlLsESRTtSX6rSl70ZU5O-CbnooQ_FUm78K4bGSorQBJ_9Uky0-rkzx_w",
  "bundledBackend": true,
  "backendBaseline": "eeb2e1f1a6a0e0b021d74a6a81205255700b32e4da1c6363666b8fc558a61a79"
};
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
export function repositoryFromUrl(url) {
  const m = /^(?:https:\/\/github\.com\/|git@github\.com:)([\w.-]+\/[\w.-]+?)(?:\.git)?$/.exec(url.trim());
  if (!m || m[1].includes('..')) throw new Error('Remote origin harus repository github.com yang valid.');
  return m[1];
}
export function selectRun(runs, sha, since) {
  return runs.filter(r => r.head_sha === sha && r.head_branch === 'main' && new Date(r.created_at).getTime() >= since).sort((a,b) => b.id-a.id)[0];
}
export function isSafeNewFile(file) {
  if (/(^|\/)(?:secrets?|credentials?|node_modules|dist|artifacts|data)(\/|$)/i.test(file) || /(?:^|\/)(?:\.env|\.clasp|.*secret|.*token|.*\.key|.*\.pem)/i.test(file)) return false;
  if (file.includes('..')) return false;
  return /^(?:src|public|tests|backend|apps-script|\.github)\//.test(file) || /^[\w.-]+\.(?:mjs|cjs|js|ts|tsx|json|md|ps1|html|css)$/.test(file);
}
export function buildGoogleFiles(remote, sources, bundled) {
  const files = remote.map(f => ({ name:f.name, type:f.type, source:f.source }));
  const updates = bundled ? { Code: ['Config','Setup','Code'].map(n=>sources[n]).join('\n\n'), ...Object.fromEntries(Object.entries(sources).filter(([n])=>!['Config','Setup','Code'].includes(n))) } : sources;
  for (const [name,source] of Object.entries(updates)) {
    if (typeof source !== 'string') throw new Error('Sumber Apps Script tidak lengkap: '+name);
    // Driver production uses the historical filename Confing. Preserve that name.
    const targetName=name==='Config' && !files.some(f=>f.name==='Config') && files.some(f=>f.name==='Confing' && f.type==='SERVER_JS')?'Confing':name;
    const existing=files.find(f=>f.name===targetName && f.type==='SERVER_JS');
    if(existing) existing.source=source; else files.push({name,type:'SERVER_JS',source});
  }
  if(!files.some(f=>f.name==='appsscript' && f.type==='JSON')) throw new Error('Manifest Apps Script produksi tidak ditemukan.');
  return files;
}
export async function readPublishedRevision(url) {
  const target=new URL('release.json',url); target.searchParams.set('check',Date.now().toString());
  const response=await fetch(target,{cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!response.ok) return null;
  try {const value=await response.json(); return typeof value.commit==='string'?value.commit:null;} catch {return null;}
}
function run(command,args,options={}) {
  const result=spawnSync(command,args,{cwd:ROOT,encoding:'utf8',stdio:options.capture?'pipe':'inherit',...options});
  if(result.error) throw new Error('Tidak dapat menjalankan '+path.basename(command)+': '+result.error.message);
  if(result.status!==0) throw new Error(path.basename(command)+' gagal (exit '+result.status+').'+(options.capture?' Periksa autentikasi/konfigurasi perintah tersebut.':''));
  return result.stdout?.trim()||'';
}
function git(args,options={}) {return run('git',['-c','credential.username=EGS-EsaGemilangSakti',...args],options);}
function npm(args) {
  const cli=process.env.npm_execpath || path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
  if(!fs.existsSync(cli)) throw new Error('npm CLI tidak ditemukan. Gunakan Node.js dengan npm terpasang.');
  return run(process.execPath,[cli,...args]);
}
function backendSources() {
  if(!fs.existsSync(path.join(ROOT,'apps-script'))) return null;
  return Object.fromEntries(fs.readdirSync(path.join(ROOT,'apps-script')).filter(f=>f.endsWith('.gs')).sort().map(f=>[f.slice(0,-3),fs.readFileSync(path.join(ROOT,'apps-script',f),'utf8').replace(/\r\n/g,'\n')]));
}
function sourceHash(sources) {return crypto.createHash('sha256').update(JSON.stringify(sources)).digest('hex');}
async function main() {
  const args=process.argv.slice(2);
  if(args.includes('--help')) {console.log('node rilis.mjs --message "Deskripsi perubahan"\nnode rilis.mjs --check\nnode rilis.mjs --with-backend --message "Perubahan FE dan GAS"\nNode 20+, Git, npm diperlukan. Login sekali: node rilis.mjs --login-google; periksa: --check-google. Backend berubah akan dirilis otomatis. Lihat RILIS.md.');return;}
  const accepted=new Set(['--check','--with-backend','--frontend-only','--login-google','--check-google','--message']);
  for(let i=0;i<args.length;i++) {if(!accepted.has(args[i]))throw new Error('Argumen tidak dikenal: '+args[i]);if(args[i]==='--message'){if(!args[i+1]||args[i+1].startsWith('--'))throw new Error('Pesan commit wajib diisi.');i++;}}
  if(args.includes('--with-backend') && args.includes('--frontend-only'))throw new Error('Pilih --with-backend atau --frontend-only, bukan keduanya.');
  if(args.includes('--login-google')) {loginGoogle(CONFIG); await getAppsScriptAccessToken(); console.log('LOGIN GOOGLE VERIFIED: akun HRD, refresh token tersedia.'); return;}
  if(args.includes('--check-google')) {
    const token=await getAppsScriptAccessToken();
    const content=await appsScriptRequest(CONFIG,token,'/content');
    const deployment=await appsScriptRequest(CONFIG,token,'/deployments/'+CONFIG.deploymentId);
    console.log('GOOGLE READY: '+CONFIG.name+' | '+content.files.length+' file | deployment versi '+deployment.deploymentConfig.versionNumber);return;
  }
  if(Number(process.versions.node.split('.')[0])<20)throw new Error('Gunakan Node.js 20 atau lebih baru.');
  const originalBranch=git(['branch','--show-current'],{capture:true});
  if(originalBranch!=='main')throw new Error('Jalankan dari branch main. Skrip tidak berpindah branch otomatis.');
  const repo=repositoryFromUrl(git(['remote','get-url','origin'],{capture:true}));
  if(repo!==CONFIG.repo)throw new Error('Repository tidak sesuai konfigurasi rilis.');
  const gitDir=path.resolve(ROOT,git(['rev-parse','--git-dir'],{capture:true}));
  const lock=path.join(gitDir,'form-release.lock');
  try {fs.mkdirSync(lock);} catch {throw new Error('Ada rilis berjalan. Jika proses sebelumnya terputus, periksa lalu hapus '+lock);}
  let ghToken, googleToken;
  try {
    const statePath=path.join(gitDir,'form-release-state.json');
    const state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath,'utf8')):{};
    const sources=backendSources(),hash=sources?sourceHash(sources):null;
    const backendChanged=hash!==null && hash!==(state.backendHash||CONFIG.backendBaseline);
    const wantsBackend=args.includes('--with-backend') || (backendChanged && !args.includes('--frontend-only'));
    if(backendChanged && args.includes('--frontend-only'))throw new Error('Backend berubah; hapus --frontend-only agar frontend dan backend tetap konsisten.');
    if(wantsBackend && !sources)throw new Error('Sumber apps-script/*.gs belum tersedia pada checkout ini.');
    if(wantsBackend && !args.includes('--check')) googleToken=await getAppsScriptAccessToken();
    if(git(['diff','--name-only','--diff-filter=U'],{capture:true}))throw new Error('Selesaikan merge conflict terlebih dahulu.');
    npm(['ci','--no-audit','--no-fund']);
    const tests=fs.existsSync(path.join(ROOT,'tests'))?fs.readdirSync(path.join(ROOT,'tests')).filter(f=>f.endsWith('.test.mjs')).map(f=>'tests/'+f):[];
    if(tests.length)run(process.execPath,['--test',...tests]);
    npm(['run','lint']);npm(['run','build']);
    if(args.includes('--check')) {console.log('CHECK LULUS: tests, lint, build. Backend berubah: '+backendChanged+'. Tidak ada commit/push/deploy.');return;}
    ghToken=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
    if(!ghToken){const credentials=git(['credential','fill'],{capture:true,input:'protocol=https\nhost=github.com\nusername=EGS-EsaGemilangSakti\n\n',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});ghToken=credentials.split(/\r?\n/).find(s=>s.startsWith('password='))?.slice(9);}
    if(!ghToken)throw new Error('Login GitHub lewat Git Credential Manager atau atur GH_TOKEN.');
    async function github(route,method='GET',body) {
      const r=await fetch('https://api.github.com/repos/'+repo+'/'+route,{method,headers:{Authorization:'Bearer '+ghToken,'User-Agent':'egs-form-release','Accept':'application/vnd.github+json','Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
      if(!r.ok)throw new Error('GitHub API '+route+' gagal HTTP '+r.status+'.');
      return r.status===204?null:r.json();
    }
    await github('actions/workflows/deploy-pages.yml');
    const apiVariable=await github('actions/variables/VITE_API_URL');
    if(apiVariable.value!==CONFIG.backendUrl)throw new Error('VITE_API_URL GitHub berbeda dari endpoint produksi yang dikonfigurasi.');
    git(['fetch','origin','main']);
    const headBefore=git(['rev-parse','HEAD'],{capture:true});
    if(git(['merge-base','HEAD','origin/main'],{capture:true})!==git(['rev-parse','origin/main'],{capture:true}))throw new Error('Branch tertinggal/berbeda dengan origin/main. Sinkronkan terlebih dahulu.');
    // Stage tracked changes and explicitly safe new project sources. Ignore personal archives/screenshots/secrets.
    git(['add','--update']);
    const untracked=git(['ls-files','--others','--exclude-standard','-z'],{capture:true}).split('\0').filter(Boolean);
    const safe=untracked.filter(isSafeNewFile);
    const skipped=untracked.filter(f=>!isSafeNewFile(f));
    if(skipped.length)console.log('File lokal di luar sumber project tidak ikut commit: '+skipped.join(', '));
    if(safe.length)git(['add','--',...safe]);
    git(['diff','--cached','--check']);
    if(git(['diff','--cached','--name-only'],{capture:true})) {
      const messageIndex=args.indexOf('--message');
      git(['commit','-m',messageIndex>=0?args[messageIndex+1]:'Update '+CONFIG.name+' - '+new Date().toISOString()]);
    }
    const sha=git(['rev-parse','HEAD'],{capture:true});
    const started=Date.now()-10000;
    if(wantsBackend) {
      const token=googleToken;
      const gas=(route,method='GET',body)=>appsScriptRequest(CONFIG,token,route,method,body);
      const live=await gas('/content');
      const deployment=await gas('/deployments/'+CONFIG.deploymentId);
      const files=buildGoogleFiles(live.files,sources,CONFIG.bundledBackend);
      new vm.Script(files.filter(f=>f.type==='SERVER_JS').map(f=>f.source).join('\n'),{filename:'release-backend.gs'});
      const backupDir=path.join(gitDir,'release-backups');fs.mkdirSync(backupDir,{recursive:true});
      fs.writeFileSync(path.join(backupDir,Date.now()+'-gas.json'),JSON.stringify({content:live,deployment},null,2));
      await gas('/content','PUT',{files});
      const version=await gas('/versions','POST',{description:'Release '+sha});
      await gas('/deployments/'+CONFIG.deploymentId,'PUT',{deploymentConfig:{...deployment.deploymentConfig,versionNumber:version.versionNumber,description:'Release '+sha}});
      const active=await gas('/deployments/'+CONFIG.deploymentId);
      if(active.deploymentConfig.versionNumber!==version.versionNumber)throw new Error('Versi backend aktif tidak cocok dengan versi rilis.');
      state.backendHash=hash;state.backendVersion=version.versionNumber;fs.writeFileSync(statePath,JSON.stringify(state,null,2));
      console.log('Apps Script aktif pada versi '+version.versionNumber+' (endpoint yang sama).');
    }
    const needsPush=sha!==git(['rev-parse','origin/main'],{capture:true});
    git(['push','origin','HEAD:main']);
    // A new push starts CI; a retry/no-change invocation needs an explicit dispatch.
    if(!needsPush) await github('actions/workflows/deploy-pages.yml/dispatches','POST',{ref:'main'});
    let successful=false;
    const deadline=Date.now()+20*60*1000;
    while(Date.now()<deadline){
      const list=await github('actions/workflows/deploy-pages.yml/runs?branch=main&head_sha='+sha+'&per_page=20');
      const run=selectRun(list.workflow_runs||[],sha,started);
      if(run){console.log('GitHub Pages: '+run.status+(run.conclusion?' / '+run.conclusion:'')+' '+run.html_url);if(run.status==='completed'){if(run.conclusion!=='success')throw new Error('Deployment gagal: '+run.html_url);successful=true;break;}}
      await sleep(15000);
    }
    if(!successful)throw new Error('Batas tunggu deployment habis. Periksa GitHub Actions; jangan menganggap sudah publish.');
    for(let i=0;i<40;i++){
      try {if(await readPublishedRevision(CONFIG.siteUrl)===sha){
        const api=await fetch(CONFIG.backendUrl,{signal:AbortSignal.timeout(30000)});const health=await api.json();if(!api.ok||health.success!==true)throw new Error('Backend health check tidak berhasil.');
        console.log('PROD VERIFIED: '+CONFIG.siteUrl+' commit '+sha+(sha===headBefore?' (rilis ulang)':''));return;
      }}catch(e){if(i===39)throw e;}
      console.log('Menunggu commit terbaru muncul pada domain produksi...');await sleep(10000);
    }
    throw new Error('Domain belum menampilkan commit '+sha+'. Periksa cache/DNS/Pages.');
  } finally {googleToken=undefined;ghToken=undefined;fs.rmdirSync(lock);}
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error('RILIS GAGAL: '+error.message);process.exitCode=1;});
