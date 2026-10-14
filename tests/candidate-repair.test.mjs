import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const ctx=vm.createContext({});vm.runInContext(await readFile('apps-script/Repair.gs','utf8'),ctx);
const r=(nik,row,time,placement='JAT',finger='16')=>({nik,row,time,placement,finger,id:String(row)});
const a='0000000000000001',b='0000000000000002';
test('promotes earliest revision only for orphan NIK, preserves existing registrations, and is idempotent',()=>{
 const initial=[r(b,2,100,'JRT')],revisions=[r(a,2,300),r(a,3,100),r(a,4,200),r(b,5,200,'JRT')];
 const plan=ctx.planCandidateLegacyRepair(initial,revisions);
 assert.equal(plan.moves.length,1);assert.equal(plan.moves[0].row,3);assert.equal(plan.issues.length,0);
 const again=ctx.planCandidateLegacyRepair(initial.concat(plan.moves),revisions.filter(x=>x.row!==3));assert.equal(again.moves.length,0);
});
test('flags excess history and same-placement collisions; never deletes excess rows',()=>{
 const plan=ctx.planCandidateLegacyRepair([r(b,2,100)],[r(a,2,1),r(a,3,2),r(a,4,3),r(a,5,4)]);
 assert.equal(plan.moves.length,1);assert.equal(plan.revisionCount,4);
 assert.ok(plan.issues.some(x=>x.reason.includes('Riwayat melebihi')));
 assert.ok(plan.issues.some(x=>x.reason.includes('Bentrok')));
});
test('ambiguous dates or invalid NIK require HR review instead of guessing initial row',()=>{
 const plan=ctx.planCandidateLegacyRepair([],[r(a,2,NaN),r(a,3,2),r('123',4,1)]);
 assert.equal(plan.moves.length,0);assert.equal(plan.issues.filter(x=>x.reason.includes('waktu tidak valid')).length,3);
});
