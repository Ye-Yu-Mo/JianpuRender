/**
 * Tests for ornament field propagation through the data pipeline.
 * M4: Render ornament symbols
 *
 * Rendering layer (SVG output) requires a DOM and is tested visually via demo.
 * These tests cover the data pipeline: NoteInfo → JianpuNote → JianpuBlock.
 */
import * as test from 'tape';
import { JianpuModel } from '../src/jianpu_model';
import { NoteInfo } from '../src/jianpu_info';
import { splitJianpuNote, JianpuNote } from '../src/jianpu_block';

function note(start: number, length: number, pitch = 60, overrides: Partial<NoteInfo> = {}): NoteInfo {
  return { start, length, pitch, intensity: 0.65, ...overrides };
}

function makeJianpuNote(overrides: Partial<JianpuNote> = {}): JianpuNote {
  return {
    start: 0, length: 2, pitch: 60, intensity: 0.65,
    jianpuNumber: 1, octaveDot: 0, accidental: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. ornament 字段通过 createJianpuNote() 传递到 JianpuNote
// ---------------------------------------------------------------------------
test('ornament: trill propagates to JianpuNote in block', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { ornament: 'trill' }),
      note(1, 1, 62),
      note(2, 1, 64),
      note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.ok(block, 'block at 0 exists');
  t.equal(block?.notes[0].ornament, 'trill', 'ornament=trill on JianpuNote');
  t.end();
});

test('ornament: mordent propagates to JianpuNote in block', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { ornament: 'mordent' }),
      note(1, 1, 62),
      note(2, 1, 64),
      note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.equal(block?.notes[0].ornament, 'mordent', 'ornament=mordent on JianpuNote');
  t.end();
});

test('ornament: turn propagates to JianpuNote in block', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { ornament: 'turn' }),
      note(1, 1, 62),
      note(2, 1, 64),
      note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.equal(block?.notes[0].ornament, 'turn', 'ornament=turn on JianpuNote');
  t.end();
});

// ---------------------------------------------------------------------------
// 2. 无 ornament 的音符，block 的 note.ornament 为 undefined
// ---------------------------------------------------------------------------
test('ornament: absent on plain note', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60),
      note(1, 1, 62),
      note(2, 1, 64),
      note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.equal(block?.notes[0].ornament, undefined, 'ornament undefined on plain note');
  t.end();
});

// ---------------------------------------------------------------------------
// 3. ornament 在延音线分裂后只保留在第一片（splitJianpuNote 行为）
// ---------------------------------------------------------------------------
test('ornament: stays on first fragment after split, absent on second', (t: test.Test) => {
  const n = makeJianpuNote({ length: 2, ornament: 'trill' });
  const second = splitJianpuNote(n, 1);
  t.equal(n.ornament, 'trill', 'first fragment keeps ornament');
  t.equal(second?.ornament, undefined, 'second fragment has no ornament');
  t.end();
});

// ---------------------------------------------------------------------------
// 4. ornament 在跨拍分裂（splitToBeat）后只保留在第一个 block 的 note 上
// ---------------------------------------------------------------------------
test('ornament: only on first block after beat-split of half note', (t: test.Test) => {
  // 二分音符（length=2）在 4/4 拍会被 splitToBeat 切成两个四分音符 block
  const model = new JianpuModel({
    notes: [
      note(0, 2, 60, { ornament: 'trill' }),
      note(2, 1, 62),
      note(3, 1, 64),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const firstBlock = model.jianpuBlockMap.get(0);
  // splitToBeat 产生的 key 有浮点误差，用 find 查找 start ≈ 1 的 block
  const secondBlock = Array.from(model.jianpuBlockMap.values())
    .find(b => Math.abs(b.start - 1) < 1e-3 && b.notes.length > 0 && b.notes[0].tiedFrom);

  t.ok(firstBlock, 'first block at 0 exists');
  t.ok(secondBlock, 'second block near 1 exists (tie continuation)');
  t.equal(firstBlock?.notes[0].ornament, 'trill', 'ornament on first block note');
  t.equal(secondBlock?.notes[0].ornament, undefined, 'no ornament on second block note');
  t.end();
});

// ---------------------------------------------------------------------------
// 5. ornament 与八度点共存：两者都在 note 上，互不干扰
// ---------------------------------------------------------------------------
test('ornament: coexists with octaveDot on same note', (t: test.Test) => {
  // pitch=72 = C5，在 C 大调下 octaveDot=1
  const model = new JianpuModel({
    notes: [
      note(0, 1, 72, { ornament: 'trill' }),
      note(1, 1, 62),
      note(2, 1, 64),
      note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.equal(block?.notes[0].ornament, 'trill', 'ornament present');
  t.equal(block?.notes[0].octaveDot, 1, 'octaveDot=1 also present');
  t.end();
});
