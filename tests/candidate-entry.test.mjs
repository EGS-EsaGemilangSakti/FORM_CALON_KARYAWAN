import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const resolve=createRequire(import.meta.url);
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost'});
for(const key of ['window','document','HTMLElement','HTMLInputElement','Event','InputEvent'])globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const bundle=await build({stdin:{contents:`
import React,{act} from 'react';import {createRoot} from 'react-dom/client';
import {CandidateEntry} from './src/components/forms/CandidateEntry';
export {act};export function mount(onContinue){const root=createRoot(document.getElementById('root'));root.render(<CandidateEntry initialNik="" onContinue={onContinue}/>);return root;}
`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'test-dependencies',setup(builder){
 builder.onResolve({filter:/services\/api$/},()=>({path:'mock-api',namespace:'mock'}));
 builder.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const checkCandidateEligibility=(...args)=>globalThis.checkEligibility(...args);',loader:'js'}));
 builder.onResolve({filter:/^[^./]/},args=>({path:pathToFileURL(resolve.resolve(args.path)).href,external:true}));
}}]});
const {act,mount}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('entry blocks unknown NIK and exhausted revisions before allowing access; failed request is retryable',async()=>{
 let root,continued=null,calls=0,response={success:false,message:'NIK belum terdaftar'};
 globalThis.checkEligibility=async(nik,type)=>{calls++;assert.equal(nik,'0000000000000001');assert.equal(type,'REVISION');return response};
 await act(async()=>{root=mount(value=>{continued=value})});
 try{
 const input=document.querySelector('input'),select=document.querySelector('select'),button=document.querySelector('button');
 await act(async()=>{select.value='REVISION';select.dispatchEvent(new Event('change',{bubbles:true}));button.click()});
 assert.equal(calls,0);assert.match(document.querySelector('[role="alert"]').textContent,/16 digit/);
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'0000000000000001');input.dispatchEvent(new InputEvent('input',{bubbles:true}))});
 await act(async()=>button.click());assert.equal(continued,null);assert.match(document.querySelector('[role="alert"]').textContent,/belum terdaftar/);
 response={success:false,message:'Batas pengisian tercapai'};
 await act(async()=>button.click());assert.equal(continued,null);
 globalThis.checkEligibility=async()=>{throw Error('Network error')};
 await act(async()=>button.click());assert.equal(continued,null);assert.equal(button.disabled,false);
 globalThis.checkEligibility=async()=>({success:true});
 await act(async()=>button.click());assert.deepEqual(continued,{nik:'0000000000000001',submissionType:'REVISION'});
 }finally{await act(async()=>root.unmount());dom.window.close()}
});
