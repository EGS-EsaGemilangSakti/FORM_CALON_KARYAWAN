import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const resolvePackage = createRequire(import.meta.url);

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLInputElement', 'Event', 'InputEvent', 'CompositionEvent', 'FocusEvent', 'FileList']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const bundle = await build({ stdin: { contents: `
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useForm } from 'react-hook-form';
import { FullNameField } from './src/components/fields/FullNameField';
import { AccountOwnerField } from './src/components/fields/AccountOwnerField';
import { PersonalEmergencyFields } from './src/components/fields/AdditionalEmployeeFields';
let form;
function Harness() {
  form = useForm({defaultValues:{fullName:'',accountOwner:'',motherName:'',emergencyContactName:''}});
  const values = form.watch();
  return <><FullNameField register={form.register} setValue={form.setValue}/><AccountOwnerField register={form.register} setValue={form.setValue} onChanged={()=>{}}/><PersonalEmergencyFields register={form.register} setValue={form.setValue} errors={{}}/><output>{JSON.stringify(values)}</output></>;
}
export { act };
export const getForm = () => form;
export const mount = () => { const root=createRoot(document.getElementById('root'));root.render(<Harness/>);return root; };
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, plugins: [{ name: 'node-packages', setup(builder) { builder.onResolve({filter:/^[^./]/}, args => ({path:pathToFileURL(resolvePackage.resolve(args.path)).href,external:true})); } }], platform: 'node', format: 'esm', banner: { js: 'import { createRequire } from '+JSON.stringify('node:module')+'; const require = createRequire('+JSON.stringify(pathToFileURL(process.cwd()+'/package.json').href)+');' }, define: { 'process.env.NODE_ENV': '"development"' }, jsx: 'automatic' });
const { act, mount, getForm } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
async function input(element, value, inputType, isComposing=false, caret=value.length) {
  await act(async()=>{nativeSet.call(element,value);element.setSelectionRange(caret,caret);element.dispatchEvent(new InputEvent('input',{bubbles:true,inputType,data:null,isComposing}));});
}

test('Android composition, spaces, paste and middle edits retain text and cursor until blur', async()=>{
 let root; await act(async()=>{root=mount();});
 try {
  for(const name of ['fullName','accountOwner','motherName','emergencyContactName']) {
   const el=document.querySelector('input[name="'+name+'"]');el.focus();
   await act(async()=>{el.dispatchEvent(new CompositionEvent('compositionstart',{bubbles:true}));});
   await input(el,'moch.','insertCompositionText',true);
   assert.equal(el.value,'moch.');
   await act(async()=>{el.dispatchEvent(new CompositionEvent('compositionend',{bubbles:true,data:'moch.'}));});
   await input(el,'moch. ','insertText');
   assert.equal(el.value,'moch. ');assert.equal(getForm().getValues(name),'moch. ');
   await input(el,'moch. arizal ','insertText');
   assert.equal(el.value,'moch. arizal ');
   await input(el,'moch.  arizal ','insertText',false,7);
   assert.equal(el.selectionStart,7);assert.equal(el.value,'moch.  arizal ');
   await input(el,'dyah woro palupi ','insertFromPaste');
   assert.equal(el.value,'dyah woro palupi ');
   await act(async()=>{el.blur();});
   assert.equal(el.value,'DYAH WORO PALUPI');assert.equal(getForm().getValues(name),'DYAH WORO PALUPI');
   assert.equal(el.classList.contains('uppercase'),true);
  }
 } finally { await act(async()=>root.unmount()); dom.window.close(); }
});


