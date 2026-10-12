import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/utils/validators.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { fileToBase64Payload } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
let reads = 0;
const failures = new WeakMap();
globalThis.FileReader = class {
  readAsDataURL(file) {
    reads++;
    queueMicrotask(async () => {
      const failure = failures.get(file);
      if (failure === 'abort') return this.onabort();
      if (failure === 'error') return this.onerror();
      this.result = failure === 'empty' ? '' : `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString('base64')}`;
      this.onload();
    });
  }
};

const pdf = (content = 'document') => new File([content], 'document.pdf', { type: 'application/pdf' });
test('prepares bytes once and submits cached bytes after the original becomes unreadable', async () => {
  const file = pdf();
  const before = reads;
  const first = fileToBase64Payload(file);
  const concurrent = fileToBase64Payload(file);
  const payload = await first;
  assert.deepEqual(await concurrent, payload);
  failures.set(file, 'error');
  assert.deepEqual(await fileToBase64Payload(file), payload);
  assert.equal(reads - before, 1);
  assert.equal(Buffer.from(payload.base64, 'base64').toString(), 'document');
});
test('replacement with the same name gets its own content', async () => {
  const one = await fileToBase64Payload(pdf('one'));
  const two = await fileToBase64Payload(pdf('two'));
  assert.notEqual(one.base64, two.base64);
});
test('read errors, aborts and empty results reject and allow retry', async () => {
  for (const failure of ['error', 'abort', 'empty']) {
    const file = pdf();
    failures.set(file, failure);
    await assert.rejects(fileToBase64Payload(file), /pilih ulang/i);
    failures.delete(file);
    assert.ok((await fileToBase64Payload(file)).base64);
  }
});
test('invalid or empty uploads are rejected before reading', async () => {
  const before = reads;
  await assert.rejects(fileToBase64Payload(pdf('')), /tidak kosong/);
  await assert.rejects(fileToBase64Payload(new File(['text'], 'text.txt', { type: 'text/plain' })), /PDF/);
  assert.equal(reads, before);
});

test('cached failures use the document label of each caller', async () => {
  const file = pdf();
  failures.set(file, 'error');
  await Promise.all([
    assert.rejects(fileToBase64Payload(file, 'KTP'), /KTP \(document.pdf\)/),
    assert.rejects(fileToBase64Payload(file, 'Kartu Keluarga'), /Kartu Keluarga \(document.pdf\)/),
  ]);
});
