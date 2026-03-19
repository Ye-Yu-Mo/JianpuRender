/**
 * Tests for NoteInfo extended notation fields and splitJianpuNote field propagation.
 * M1: Extend data model
 */
import * as test from 'tape';
import { NoteInfo } from '../src/jianpu_info';
import { JianpuNote, splitJianpuNote } from '../src/jianpu_block';

// ---------------------------------------------------------------------------
// Helper: build a minimal JianpuNote
// ---------------------------------------------------------------------------
function makeNote(overrides: Partial<JianpuNote> = {}): JianpuNote {
  return {
    start: 0,
    length: 2,
    pitch: 60,
    intensity: 0.65,
    jianpuNumber: 1,
    octaveDot: 0,
    accidental: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. NoteInfo accepts new optional fields (TypeScript type check at compile time)
// ---------------------------------------------------------------------------
test('NoteInfo: accepts isGrace field', (t: test.Test) => {
  const n: NoteInfo = { start: 0, length: 0.0625, pitch: 60, intensity: 0.5, isGrace: true };
  t.equal(n.isGrace, true, 'isGrace is true');
  t.end();
});

test('NoteInfo: accepts ornament field', (t: test.Test) => {
  const n: NoteInfo = { start: 0, length: 1, pitch: 60, intensity: 0.5, ornament: 'trill' };
  t.equal(n.ornament, 'trill', 'ornament is trill');
  t.end();
});

test('NoteInfo: accepts articulations field', (t: test.Test) => {
  const n: NoteInfo = {
    start: 0, length: 1, pitch: 60, intensity: 0.5,
    articulations: ['staccato', 'accent'],
  };
  t.deepEqual(n.articulations, ['staccato', 'accent'], 'articulations array');
  t.end();
});

test('NoteInfo: accepts tuplet field', (t: test.Test) => {
  const n: NoteInfo = {
    start: 0, length: 0.5, pitch: 60, intensity: 0.5,
    tuplet: { type: 'start', actual: 3, normal: 2 },
  };
  t.equal(n.tuplet?.type, 'start', 'tuplet type is start');
  t.equal(n.tuplet?.actual, 3, 'tuplet actual is 3');
  t.equal(n.tuplet?.normal, 2, 'tuplet normal is 2');
  t.end();
});

test('NoteInfo: new fields are optional (plain note without them)', (t: test.Test) => {
  const n: NoteInfo = { start: 0, length: 1, pitch: 60, intensity: 0.5 };
  t.equal(n.isGrace, undefined, 'isGrace undefined by default');
  t.equal(n.ornament, undefined, 'ornament undefined by default');
  t.equal(n.articulations, undefined, 'articulations undefined by default');
  t.equal(n.tuplet, undefined, 'tuplet undefined by default');
  t.end();
});

// ---------------------------------------------------------------------------
// 2. splitJianpuNote: second fragment must NOT carry ornament/articulations/isGrace
// ---------------------------------------------------------------------------
test('splitJianpuNote: ornament stays on first fragment only', (t: test.Test) => {
  const note = makeNote({ length: 2, ornament: 'trill' });
  const second = splitJianpuNote(note, 1);
  t.equal(note.ornament, 'trill', 'first fragment keeps ornament');
  t.equal(second?.ornament, undefined, 'second fragment has no ornament');
  t.end();
});

test('splitJianpuNote: articulations stay on first fragment only', (t: test.Test) => {
  const note = makeNote({ length: 2, articulations: ['staccato'] });
  const second = splitJianpuNote(note, 1);
  t.deepEqual(note.articulations, ['staccato'], 'first fragment keeps articulations');
  t.equal(second?.articulations, undefined, 'second fragment has no articulations');
  t.end();
});

test('splitJianpuNote: isGrace stays on first fragment only', (t: test.Test) => {
  // Grace notes have length 0.0625; split at 0.03125
  const note = makeNote({ start: 0, length: 0.0625, isGrace: true });
  const second = splitJianpuNote(note, 0.03125);
  t.equal(note.isGrace, true, 'first fragment keeps isGrace');
  t.equal(second?.isGrace, undefined, 'second fragment has no isGrace');
  t.end();
});

// ---------------------------------------------------------------------------
// 3. splitJianpuNote: tuplet field IS preserved on second fragment
// ---------------------------------------------------------------------------
test('splitJianpuNote: tuplet is preserved on second fragment', (t: test.Test) => {
  const note = makeNote({
    length: 2,
    tuplet: { type: 'start', actual: 3, normal: 2 },
  });
  const second = splitJianpuNote(note, 1);
  t.deepEqual(
    second?.tuplet,
    { type: 'start', actual: 3, normal: 2 },
    'second fragment preserves tuplet'
  );
  t.end();
});

test('splitJianpuNote: tuplet middle type preserved on second fragment', (t: test.Test) => {
  const note = makeNote({
    length: 2,
    tuplet: { type: 'middle', actual: 3, normal: 2 },
  });
  const second = splitJianpuNote(note, 1);
  t.equal(second?.tuplet?.type, 'middle', 'middle type preserved');
  t.end();
});

// ---------------------------------------------------------------------------
// 4. splitJianpuNote: returns null when split point is out of range
// ---------------------------------------------------------------------------
test('splitJianpuNote: returns null when split at start', (t: test.Test) => {
  const note = makeNote({ start: 0, length: 2 });
  t.equal(splitJianpuNote(note, 0), null, 'null when split at start');
  t.end();
});

test('splitJianpuNote: returns null when split at end', (t: test.Test) => {
  const note = makeNote({ start: 0, length: 2 });
  t.equal(splitJianpuNote(note, 2), null, 'null when split at end');
  t.end();
});
