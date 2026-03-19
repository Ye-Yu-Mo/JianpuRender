/**
 * Tests for grace note handling in infoToBlocks().
 * M3: Render grace notes
 */
import * as test from 'tape';
import { JianpuModel } from '../src/jianpu_model';
import { NoteInfo } from '../src/jianpu_info';

function note(start: number, length: number, pitch = 60, overrides: Partial<NoteInfo> = {}): NoteInfo {
  return { start, length, pitch, intensity: 0.65, ...overrides };
}

// ---------------------------------------------------------------------------
// 1. grace note 生成 isGrace=true 的 block
// ---------------------------------------------------------------------------
test('grace note: block has isGrace=true', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.0625, 71, { isGrace: true }),  // grace note: F#4 (pitch=71)
      note(0, 1, 67),                           // main note: G4
      note(1, 1, 69),
      note(2, 1, 71),
      note(3, 1, 72),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  // grace block は start - ε の key で格納される
  const graceKey = Array.from(model.jianpuBlockMap.keys()).find(k => k < 0 || (k >= -1e-3 && k < 0) || model.jianpuBlockMap.get(k)?.isGrace);
  const graceBlock = graceKey !== undefined ? model.jianpuBlockMap.get(graceKey) : undefined;
  t.ok(graceBlock, 'grace block exists');
  t.equal(graceBlock?.isGrace, true, 'grace block has isGrace=true');
  t.end();
});

// ---------------------------------------------------------------------------
// 2. grace block の length === 0
// ---------------------------------------------------------------------------
test('grace note: block length is 0', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.0625, 71, { isGrace: true }),
      note(0, 1, 67),
      note(1, 1, 69),
      note(2, 1, 71),
      note(3, 1, 72),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const graceBlock = Array.from(model.jianpuBlockMap.values()).find(b => b.isGrace);
  t.ok(graceBlock, 'grace block exists');
  t.equal(graceBlock?.length, 0, 'grace block length is 0');
  t.end();
});

// ---------------------------------------------------------------------------
// 3. grace note の前に誤った rest block が挿入されない
// ---------------------------------------------------------------------------
test('grace note: no spurious rest before main note', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.0625, 71, { isGrace: true }),
      note(0, 1, 67),
      note(1, 1, 69),
      note(2, 1, 71),
      note(3, 1, 72),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  // time=0 の主音符 block が存在すること
  const mainBlock = model.jianpuBlockMap.get(0);
  t.ok(mainBlock, 'main note block at 0 exists');
  t.equal(mainBlock?.notes.length, 1, 'main block has 1 note');
  t.equal(mainBlock?.isGrace, undefined, 'main block is not grace');
  t.end();
});

// ---------------------------------------------------------------------------
// 4. grace block の calculateRenderProperties は durationLines を設定しない
// ---------------------------------------------------------------------------
test('grace note: no durationLines on grace block', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.0625, 71, { isGrace: true }),
      note(0, 1, 67),
      note(1, 1, 69),
      note(2, 1, 71),
      note(3, 1, 72),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const graceBlock = Array.from(model.jianpuBlockMap.values()).find(b => b.isGrace);
  t.ok(graceBlock, 'grace block exists');
  t.equal(graceBlock?.durationLines, undefined, 'grace block has no durationLines');
  t.equal(graceBlock?.augmentationDash, undefined, 'grace block has no augmentationDash');
  t.end();
});

// ---------------------------------------------------------------------------
// 5. grace block の key は主音符より小さい（方案A: start - ε）
// ---------------------------------------------------------------------------
test('grace note: grace block key is less than main note key', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.0625, 71, { isGrace: true }),
      note(0, 1, 67),
      note(1, 1, 69),
      note(2, 1, 71),
      note(3, 1, 72),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const graceBlock = Array.from(model.jianpuBlockMap.values()).find(b => b.isGrace);
  const graceKey = Array.from(model.jianpuBlockMap.entries()).find(([, b]) => b.isGrace)?.[0];
  t.ok(graceKey !== undefined, 'grace key exists');
  t.ok(graceKey! < 0, 'grace block key is less than 0 (before main note at 0)');
  t.end();
});
