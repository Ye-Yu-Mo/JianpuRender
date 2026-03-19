/**
 * Tests for articulation field propagation through the data pipeline.
 * M5: Render articulation marks
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
// 1. articulations 字段通过 createJianpuNote() 传递到 JianpuNote
// ---------------------------------------------------------------------------
test('articulations: staccato propagates to JianpuNote in block', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { articulations: ['staccato'] }),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.ok(block, 'block at 0 exists');
  t.deepEqual(block?.notes[0].articulations, ['staccato'], 'staccato on JianpuNote');
  t.end();
});

test('articulations: accent propagates to JianpuNote in block', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { articulations: ['accent'] }),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.deepEqual(block?.notes[0].articulations, ['accent'], 'accent on JianpuNote');
  t.end();
});

test('articulations: tenuto propagates to JianpuNote in block', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { articulations: ['tenuto'] }),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.deepEqual(block?.notes[0].articulations, ['tenuto'], 'tenuto on JianpuNote');
  t.end();
});

test('articulations: multiple marks propagate together', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { articulations: ['accent', 'staccato'] }),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.deepEqual(block?.notes[0].articulations, ['accent', 'staccato'], 'multiple articulations preserved');
  t.end();
});

// ---------------------------------------------------------------------------
// 2. 无 articulations 的音符，block.notes[0].articulations 为 undefined
// ---------------------------------------------------------------------------
test('articulations: absent on plain note', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.equal(block?.notes[0].articulations, undefined, 'articulations undefined on plain note');
  t.end();
});

// ---------------------------------------------------------------------------
// 3. splitJianpuNote: 第二片不携带 articulations
// ---------------------------------------------------------------------------
test('articulations: absent on second fragment after split', (t: test.Test) => {
  const n = makeJianpuNote({ length: 2, articulations: ['staccato'] });
  const second = splitJianpuNote(n, 1);
  t.deepEqual(n.articulations, ['staccato'], 'first fragment keeps articulations');
  t.equal(second?.articulations, undefined, 'second fragment has no articulations');
  t.end();
});

// ---------------------------------------------------------------------------
// 4. 跨拍分裂后，第二个 block 的 note 无 articulations
// ---------------------------------------------------------------------------
test('articulations: only on first block after beat-split', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 2, 60, { articulations: ['accent'] }),
      note(2, 1, 62), note(3, 1, 64),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const firstBlock = model.jianpuBlockMap.get(0);
  const secondBlock = Array.from(model.jianpuBlockMap.values())
    .find(b => Math.abs(b.start - 1) < 1e-3 && b.notes.length > 0 && b.notes[0].tiedFrom);

  t.ok(firstBlock, 'first block at 0 exists');
  t.ok(secondBlock, 'second block near 1 exists (tie continuation)');
  t.deepEqual(firstBlock?.notes[0].articulations, ['accent'], 'articulations on first block note');
  t.equal(secondBlock?.notes[0].articulations, undefined, 'no articulations on second block note');
  t.end();
});

// ---------------------------------------------------------------------------
// 5. articulations 与 ornament 共存时，两者都在 note 上
// ---------------------------------------------------------------------------
test('articulations: coexists with ornament on same note', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { ornament: 'trill', articulations: ['staccato'] }),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.equal(block?.notes[0].ornament, 'trill', 'ornament present');
  t.deepEqual(block?.notes[0].articulations, ['staccato'], 'articulations present');
  t.end();
});

// ---------------------------------------------------------------------------
// 6. staccatissimo 和 strong-accent 也能传递
// ---------------------------------------------------------------------------
test('articulations: staccatissimo propagates', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { articulations: ['staccatissimo'] }),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.deepEqual(block?.notes[0].articulations, ['staccatissimo'], 'staccatissimo on JianpuNote');
  t.end();
});

test('articulations: strong-accent propagates', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 1, 60, { articulations: ['strong-accent'] }),
      note(1, 1, 62), note(2, 1, 64), note(3, 1, 65),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const block = model.jianpuBlockMap.get(0);
  t.deepEqual(block?.notes[0].articulations, ['strong-accent'], 'strong-accent on JianpuNote');
  t.end();
});
