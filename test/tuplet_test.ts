/**
 * Tests for JianpuBlock.tupletInfo derivation in calculateRenderProperties().
 * M2: Render tuplet brackets
 */
import * as test from 'tape';
import { JianpuModel } from '../src/jianpu_model';
import { NoteInfo } from '../src/jianpu_info';

// ---------------------------------------------------------------------------
// Helper: build a minimal NoteInfo
// ---------------------------------------------------------------------------
function note(start: number, length: number, pitch = 60, overrides: Partial<NoteInfo> = {}): NoteInfo {
  return { start, length, pitch, intensity: 0.65, ...overrides };
}

// ---------------------------------------------------------------------------
// 1. Block with tuplet.type='start' → tupletInfo.type === 'start'
// ---------------------------------------------------------------------------
test('tupletInfo: start note gets type=start', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.5, 60, { tuplet: { type: 'start', actual: 3, normal: 2 } }),
      note(0.5, 0.5, 62, { tuplet: { type: 'middle', actual: 3, normal: 2 } }),
      note(1.0, 0.5, 64, { tuplet: { type: 'stop', actual: 3, normal: 2 } }),
      note(1.5, 1.0, 65), // normal note to fill 4/4 bar
      note(2.5, 1.0, 67),
      note(3.5, 0.5, 69),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const startBlock = model.jianpuBlockMap.get(0);
  t.ok(startBlock, 'block at 0 exists');
  t.equal(startBlock?.tupletInfo?.type, 'start', 'tupletInfo.type is start');
  t.equal(startBlock?.tupletInfo?.actual, 3, 'tupletInfo.actual is 3');
  t.end();
});

// ---------------------------------------------------------------------------
// 2. Block with tuplet.type='stop' → tupletInfo.type === 'stop'
// ---------------------------------------------------------------------------
test('tupletInfo: stop note gets type=stop', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.5, 60, { tuplet: { type: 'start', actual: 3, normal: 2 } }),
      note(0.5, 0.5, 62, { tuplet: { type: 'middle', actual: 3, normal: 2 } }),
      note(1.0, 0.5, 64, { tuplet: { type: 'stop', actual: 3, normal: 2 } }),
      note(1.5, 1.0, 65),
      note(2.5, 1.0, 67),
      note(3.5, 0.5, 69),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const stopBlock = model.jianpuBlockMap.get(1.0);
  t.ok(stopBlock, 'block at 1.0 exists');
  t.equal(stopBlock?.tupletInfo?.type, 'stop', 'tupletInfo.type is stop');
  t.equal(stopBlock?.tupletInfo?.actual, 3, 'tupletInfo.actual is 3');
  t.end();
});

// ---------------------------------------------------------------------------
// 3. Block with tuplet.type='middle' → tupletInfo.type === 'middle'
// ---------------------------------------------------------------------------
test('tupletInfo: middle note gets type=middle', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0, 0.5, 60, { tuplet: { type: 'start', actual: 3, normal: 2 } }),
      note(0.5, 0.5, 62, { tuplet: { type: 'middle', actual: 3, normal: 2 } }),
      note(1.0, 0.5, 64, { tuplet: { type: 'stop', actual: 3, normal: 2 } }),
      note(1.5, 1.0, 65),
      note(2.5, 1.0, 67),
      note(3.5, 0.5, 69),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const middleBlock = model.jianpuBlockMap.get(0.5);
  t.ok(middleBlock, 'block at 0.5 exists');
  t.equal(middleBlock?.tupletInfo?.type, 'middle', 'tupletInfo.type is middle');
  t.end();
});

// ---------------------------------------------------------------------------
// 4. Block without tuplet → tupletInfo === undefined
// ---------------------------------------------------------------------------
test('tupletInfo: normal note has no tupletInfo', (t: test.Test) => {
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
  t.ok(block, 'block at 0 exists');
  t.equal(block?.tupletInfo, undefined, 'tupletInfo is undefined for normal note');
  t.end();
});

// ---------------------------------------------------------------------------
// 5. Five-tuplet: actual=5 is preserved
// ---------------------------------------------------------------------------
test('tupletInfo: five-tuplet actual=5 preserved', (t: test.Test) => {
  const model = new JianpuModel({
    notes: [
      note(0,   0.5, 60, { tuplet: { type: 'start',  actual: 5, normal: 4 } }),
      note(0.5, 0.5, 62, { tuplet: { type: 'middle', actual: 5, normal: 4 } }),
      note(1.0, 0.5, 64, { tuplet: { type: 'middle', actual: 5, normal: 4 } }),
      note(1.5, 0.5, 65, { tuplet: { type: 'middle', actual: 5, normal: 4 } }),
      note(2.0, 0.5, 67, { tuplet: { type: 'stop',   actual: 5, normal: 4 } }),
      note(2.5, 1.5, 69),
    ],
    timeSignatures: [{ start: 0, numerator: 4, denominator: 4 }],
  });

  const startBlock = model.jianpuBlockMap.get(0);
  t.equal(startBlock?.tupletInfo?.actual, 5, 'five-tuplet actual is 5');
  t.equal(startBlock?.tupletInfo?.type, 'start', 'five-tuplet start type');
  t.end();
});
