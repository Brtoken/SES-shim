import test from 'ava';
import { assertLogs, throwsAndLogs } from './throws-and-logs.js';
import { assert } from '../../src/error/assert.js';

const { details: d, quote: q } = assert;

// Self-test of the example from the throwsAndLogs comment.
test('throwsAndLogs with data', t => {
  const obj = {};
  throwsAndLogs(
    t,
    () => {
      console.error('what', obj);
      throw new TypeError('foo');
    },
    /foo/,
    [
      ['error', 'what', obj],
      ['log', 'Caught', TypeError],
    ],
  );
  throwsAndLogs(
    t,
    () => {
      console.error('what', obj);
      throw new TypeError('foo');
    },
    /foo/,
    [
      ['error', 'what', obj],
      ['log', 'Caught', '(TypeError#1)'],
      ['group', 'Nested error'],
      ['debug', 'TypeError#1:', 'foo'],
      ['debug', '', 'stack of TypeError\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
});

test('throwsAndLogs with error', t => {
  const err = new EvalError('bar');
  throwsAndLogs(
    t,
    () => {
      console.warn('what', err);
      throw new URIError('foo');
    },
    /foo/,
    [
      ['warn', 'what', EvalError],
      ['log', 'Caught', URIError],
    ],
  );
});

test('assert', t => {
  assert(2 + 3 === 5);

  throwsAndLogs(t, () => assert(false), /Check failed/, [
    ['log', 'Caught', Error],
  ]);
  throwsAndLogs(
    t,
    () => assert(false),
    /Check failed/,
    [
      ['log', 'Caught', '(Error#1)'],
      ['group', 'Nested error'],
      ['debug', 'Error#1:', 'Check failed'],
      ['debug', '', 'stack of Error\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );

  throwsAndLogs(t, () => assert(false, 'foo'), /foo/, [
    ['log', 'Caught', Error],
  ]);
  throwsAndLogs(t, () => assert.fail(), /Assert failed/, [
    ['log', 'Caught', Error],
  ]);
  throwsAndLogs(t, () => assert.fail('foo'), /foo/, [['log', 'Caught', Error]]);
});

test('causal tree', t => {
  throwsAndLogs(
    t,
    () => {
      const fooErr = new SyntaxError('foo');
      let err1;
      try {
        assert.fail(d`synful ${fooErr}`);
      } catch (e1) {
        err1 = e1;
      }
      assert.fail(d`because ${err1}`);
    },
    /because/,
    [['log', 'Caught', Error]],
  );
  throwsAndLogs(
    t,
    () => {
      const fooErr = new SyntaxError('foo');
      let err1;
      try {
        assert.fail(d`synful ${fooErr}`);
      } catch (e1) {
        err1 = e1;
      }
      assert.fail(d`because ${err1}`);
    },
    /because/,
    [
      ['log', 'Caught', '(Error#1)'],
      ['group', 'Nested error'],
      ['debug', 'Error#1:', 'because', '(Error#2)'],
      ['debug', '', 'stack of Error\n'],
      ['group', 'Nested error under Error#1'],
      ['debug', 'Error#2:', 'synful', '(SyntaxError#3)'],
      ['debug', '', 'stack of Error\n'],
      ['group', 'Nested error under Error#2'],
      ['debug', 'SyntaxError#3:', 'foo'],
      ['debug', '', 'stack of SyntaxError\n'],
      ['groupEnd'],
      ['groupEnd'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
});

test('a causal tree falls silently', t => {
  assertLogs(
    t,
    () => {
      try {
        assert(false);
      } catch (err) {
        t.assert(err instanceof Error);
      }
    },
    [],
  );
  assertLogs(
    t,
    () => {
      try {
        assert(false);
      } catch (err) {
        t.assert(err instanceof Error);
      }
    },
    [],
    { wrapWithCausal: true },
  );
  assertLogs(
    t,
    () => {
      const fooErr = new SyntaxError('foo');
      let err1;
      try {
        assert.fail(d`synful ${fooErr}`);
      } catch (e1) {
        err1 = e1;
      }
      try {
        assert.fail(d`because ${err1}`);
      } catch (e2) {
        t.assert(e2 instanceof Error);
      }
    },
    [],
  );
  assertLogs(
    t,
    () => {
      const fooErr = new SyntaxError('foo');
      let err1;
      try {
        assert.fail(d`synful ${fooErr}`);
      } catch (e1) {
        err1 = e1;
      }
      try {
        assert.fail(d`because ${err1}`);
      } catch (e2) {
        t.assert(e2 instanceof Error);
      }
    },
    [],
    { wrapWithCausal: true },
  );
});

test('assert equals', t => {
  assert.equal(2 + 3, 5);
  throwsAndLogs(
    t,
    () => assert.equal(5, 6),
    /Expected \(a number\) is same as \(a number\)/,
    [['log', 'Caught', Error]],
  );
  throwsAndLogs(
    t,
    () => assert.equal(5, 6),
    /Expected \(a number\) is same as \(a number\)/,
    [
      ['log', 'Caught', '(RangeError#1)'],
      ['group', 'Nested error'],
      ['debug', 'RangeError#1:', 'Expected', 5, 'is same as', 6],
      ['debug', '', 'stack of RangeError\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
  throwsAndLogs(t, () => assert.equal(5, 6, 'foo'), /foo/, [
    ['log', 'Caught', Error],
  ]);
  throwsAndLogs(
    t,
    () => assert.equal(5, 6, 'foo'),
    /foo/,
    [
      ['log', 'Caught', '(RangeError#1)'],
      ['group', 'Nested error'],
      ['debug', 'RangeError#1:', 'foo'],
      ['debug', '', 'stack of RangeError\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
  throwsAndLogs(
    t,
    () => assert.equal(5, 6, d`${5} !== ${6}`),
    /\(a number\) !== \(a number\)/,
    [['log', 'Caught', Error]],
  );
  throwsAndLogs(
    t,
    () => assert.equal(5, 6, d`${5} !== ${q(6)}`),
    /\(a number\) !== 6/,
    [['log', 'Caught', Error]],
  );
  assert.equal(NaN, NaN);
  throwsAndLogs(
    t,
    () => assert.equal(-0, 0),
    /Expected \(a number\) is same as \(a number\)/,
    [
      ['log', 'Caught', '(RangeError#1)'],
      ['group', 'Nested error'],
      ['debug', 'RangeError#1:', 'Expected', -0, 'is same as', 0],
      ['debug', '', 'stack of RangeError\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
});

test('assert typeof', t => {
  assert.typeof(2, 'number');
  throwsAndLogs(
    t,
    () => assert.typeof(2, 'string'),
    /\(a number\) must be a string/,
    [['log', 'Caught', TypeError]],
  );
  throwsAndLogs(t, () => assert.typeof(2, 'string', 'foo'), /foo/, [
    ['log', 'Caught', TypeError],
  ]);
});

test('assert error default', t => {
  const err = assert.error(d`<${'bar'},${q('baz')}>`);
  t.is(err.message, '<(a string),"baz">');
  t.is(err.name, 'Error');
  throwsAndLogs(
    t,
    () => {
      throw err;
    },
    /<\(a string\),"baz">/,
    [['log', 'Caught', Error]],
  );
  throwsAndLogs(
    t,
    () => {
      throw err;
    },
    /<\(a string\),"baz">/,
    [
      ['log', 'Caught', '(Error#1)'],
      ['group', 'Nested error'],
      ['debug', 'Error#1:', '<', 'bar', ',', 'baz', '>'],
      ['debug', '', 'stack of Error\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
});

test('assert error explicit', t => {
  const err = assert.error(d`<${'bar'},${q('baz')}>`, URIError);
  t.is(err.message, '<(a string),"baz">');
  t.is(err.name, 'URIError');
  throwsAndLogs(
    t,
    () => {
      throw err;
    },
    /<\(a string\),"baz">/,
    [['log', 'Caught', URIError]],
  );
  throwsAndLogs(
    t,
    () => {
      throw err;
    },
    /<\(a string\),"baz">/,
    [
      ['log', 'Caught', '(URIError#1)'],
      ['group', 'Nested error'],
      ['debug', 'URIError#1:', '<', 'bar', ',', 'baz', '>'],
      ['debug', '', 'stack of URIError\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
});

test('assert q', t => {
  throwsAndLogs(
    t,
    () => assert.fail(d`<${'bar'},${q('baz')}>`),
    /<\(a string\),"baz">/,
    [['log', 'Caught', Error]],
  );
  throwsAndLogs(
    t,
    () => assert.fail(d`<${'bar'},${q('baz')}>`),
    /<\(a string\),"baz">/,
    [
      ['log', 'Caught', '(Error#1)'],
      ['group', 'Nested error'],
      ['debug', 'Error#1:', '<', 'bar', ',', 'baz', '>'],
      ['debug', '', 'stack of Error\n'],
      ['groupEnd'],
    ],
    { wrapWithCausal: true },
  );
  const list = ['a', 'b', 'c'];
  throwsAndLogs(t, () => assert.fail(d`${q(list)}`), /\["a","b","c"\]/, [
    ['log', 'Caught', Error],
  ]);
  const repeat = { x: list, y: list };
  throwsAndLogs(
    t,
    () => assert.fail(d`${q(repeat)}`),
    /{"x":\["a","b","c"\],"y":"<\*\*seen\*\*>"}/,
    [['log', 'Caught', Error]],
  );
  // Make it into a cycle
  list[1] = list;
  throwsAndLogs(
    t,
    () => assert.fail(d`${q(list)}`),
    /\["a","<\*\*seen\*\*>","c"\]/,
    [['log', 'Caught', Error]],
  );
  throwsAndLogs(
    t,
    () => assert.fail(d`${q(repeat)}`),
    /{"x":\["a","<\*\*seen\*\*>","c"\],"y":"<\*\*seen\*\*>"}/,
    [['log', 'Caught', Error]],
  );
});
