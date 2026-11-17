import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';

export const GOOGLE_ACCOUNT = 'hrd.esagemilangsakti@gmail.com';
export const GOOGLE_USER = 'egs-release';
export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/script.projects','https://www.googleapis.com/auth/script.deployments','https://www.googleapis.com/auth/userinfo.email'];
export function googleAuthFile() {
  return process.env.EGS_GOOGLE_AUTH_FILE || path.join(os.homedir(),'.codex','credentials','egs-apps-script','credentials.json');
}
export function readGoogleCredential(file=googleAuthFile()) {
  if(!fs.existsSync(file)) throw new Error('Login Google belum tersedia. Jalankan node rilis.mjs --login-google.');
  let data;
  try {data=JSON.parse(fs.readFileSync(file,'utf8'));} catch {throw new Error('File login Google tidak dapat dibaca. Login ulang dengan --login-google.');}
  const credential=data.tokens?.[GOOGLE_USER];
  if(!credential || credential.type!=='authorized_user' || !credential.client_id || !credential.client_secret || !credential.refresh_token) throw new Error('Login Google tidak lengkap atau tidak memiliki refresh token. Jalankan --login-google.');
  return credential;
}
export async function refreshGoogleCredential(credential,request=fetch) {
  const response=await request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'refresh_token',refresh_token:credential.refresh_token,client_id:credential.client_id,client_secret:credential.client_secret}),signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('Pembaruan token Google gagal HTTP '+response.status+'. Jalankan --login-google bila izin telah dicabut/kedaluwarsa.');
  const token=await response.json();
  if(typeof token.access_token!=='string' || !token.access_token)throw new Error('Google tidak mengembalikan access token.');
  return token.access_token;
}
export async function validateGoogleAccount(token,request=fetch) {
  const response=await request('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw new Error('Identitas login Google tidak dapat diverifikasi HTTP '+response.status+'.');
  const user=await response.json();
  if(String(user.email||'').toLowerCase()!==GOOGLE_ACCOUNT || user.verified_email!==true)throw new Error('Gunakan akun Google HRD yang sudah diverifikasi: '+GOOGLE_ACCOUNT+'.');
  return GOOGLE_ACCOUNT;
}
export async function getAppsScriptAccessToken() {
  const token=process.env.APPS_SCRIPT_ACCESS_TOKEN || await refreshGoogleCredential(readGoogleCredential());
  await validateGoogleAccount(token);
  return token;
}
export async function appsScriptRequest(config,token,route,method='GET',body,request=fetch) {
  const attempts=method==='GET'?3:1;
  for(let attempt=0;attempt<attempts;attempt++) {
    const response=await request('https://script.googleapis.com/v1/projects/'+config.scriptId+route,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
    if(response.ok)return response.json();
    if(method==='GET' && (response.status===429 || response.status>=500) && attempt+1<attempts){await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));continue;}
    throw new Error('Apps Script API '+route+' gagal HTTP '+response.status+'. Periksa login, izin project, dan API pada https://script.google.com/home/usersettings .');
  }
}

export function loginGoogle(config) {
  const authFile=googleAuthFile();
  const tools=path.join(os.homedir(),'.codex','tools','egs-apps-script');
  const projectDir=path.join(tools,'auth-project');
  const cli=path.join(tools,'node_modules','@google','clasp','build','src','index.js');
  fs.mkdirSync(path.dirname(authFile),{recursive:true,mode:0o700});fs.mkdirSync(projectDir,{recursive:true});
  if(!fs.existsSync(cli))throw new Error('Install alat resmi terlebih dahulu: npm install --prefix "'+tools+'" --save-exact @google/clasp@3.4.1');
  if(fs.existsSync(authFile) && !fs.realpathSync(authFile).startsWith(fs.realpathSync(path.dirname(authFile))+path.sep))throw new Error('File autentikasi harus berada langsung di folder kredensial yang dipilih.');
  fs.writeFileSync(path.join(projectDir,'.clasp.json'),JSON.stringify({scriptId:config.scriptId,rootDir:'.'},null,2));
  fs.writeFileSync(path.join(projectDir,'appsscript.json'),JSON.stringify({timeZone:'Asia/Jakarta',runtimeVersion:'V8',oauthScopes:GOOGLE_SCOPES},null,2));
  console.log('Login sebagai '+GOOGLE_ACCOUNT+'. Setujui izin di Google. Kredensial disimpan lokal di luar repository.');
  const result=spawnSync(process.execPath,[cli,'--auth',authFile,'--user',GOOGLE_USER,'login','--use-project-scopes','--redirect-port','53682'],{cwd:projectDir,stdio:'inherit'});
  if(result.error || result.status!==0)throw new Error('Login Google belum berhasil. Coba kembali --login-google.');
  if(fs.existsSync(authFile))fs.chmodSync(authFile,0o600);
}
