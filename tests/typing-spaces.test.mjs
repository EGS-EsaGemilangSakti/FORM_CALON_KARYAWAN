import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
const source = await readFile(new URL('../src/utils/sanitize.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { sanitizeUpperInput, sanitizeTextInput, finalizeTextInput } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
test('typing each character retains spaces until editing is finished', () => {
  let value = '';
  for (const character of 'jalaludin akbar ') value = sanitizeUpperInput(value + character);
  assert.equal(value, 'JALALUDIN AKBAR ');
  assert.equal(finalizeTextInput(value), 'JALALUDIN AKBAR');
  assert.equal(finalizeTextInput('  NAMA LENGKAP   '), 'NAMA LENGKAP');
  assert.equal(finalizeTextInput('   '), '');
});
test('addresses retain word boundaries and finalizing does not escape twice', () => {
  let value = '';
  for (const character of 'Jalan Mawar 12 ') value = sanitizeTextInput(value + character);
  assert.equal(finalizeTextInput(value), 'Jalan Mawar 12');
  const escaped = sanitizeTextInput('Blok <A> ');
  assert.equal(finalizeTextInput(escaped), 'Blok &lt;A&gt;');
});
