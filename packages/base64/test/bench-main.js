// This is a quick and dirty benchmark to encode and decode base64, intended to
// be run manually to measure performance progress or regressions.
// This is a hand-rolled benchmark that attempts as much as possible to avoid
// incorporating the noise of function calls and the underlying Date.now()
// syscall, by exponentially probing for the number of operations that can be
// executed within each benchmark's deadline.

import { encodeBase64, decodeBase64 } from '../src/main.js';

const timeout = 1000; // ms

const string = new Array(10000)
  .fill(
    'there once a rich man from nottingham who tried to cross the river. what a dope, he tripped on a rope. now look at him shiver.',
  )
  .join(' ');
const data = encodeBase64(string);

{
  const start = Date.now();
  const deadline = start + timeout / 2;
  let operations = 0;
  for (let n = 1; Date.now() < deadline; n *= 2) {
    for (let i = 0; i < n; i += 1) {
      encodeBase64(string);
    }
    operations += n;
  }
  const end = Date.now();
  const duration = end - start;
  console.log(
    'encodes',
    (operations * string.length) / duration,
    'characters per millisecond',
  );
}

{
  const start = Date.now();
  const deadline = start + timeout / 2;
  let operations = 0;
  for (let n = 1; Date.now() < deadline; n *= 2) {
    for (let i = 0; i < n; i += 1) {
      decodeBase64(data);
    }
    operations += n;
  }
  const end = Date.now();
  const duration = end - start;
  console.log(
    'decodes',
    (operations * data.length) / duration,
    'bytes per millisecond',
  );
}
