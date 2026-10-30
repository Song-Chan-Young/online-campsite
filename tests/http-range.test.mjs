import test from 'node:test';
import assert from 'node:assert/strict';
import {parseByteRange} from '../lib/http-range.mjs';

test('media requests can read their first bytes and seek without downloading the whole file',()=>{
  assert.deepEqual(parseByteRange('bytes=0-1023',4096),{start:0,end:1023});
  assert.deepEqual(parseByteRange('bytes=2048-',4096),{start:2048,end:4095});
  assert.deepEqual(parseByteRange('bytes=-256',4096),{start:3840,end:4095});
  assert.deepEqual(parseByteRange('bytes=4000-9999',4096),{start:4000,end:4095});
});
test('invalid or out-of-bounds ranges are rejected without reading outside the file',()=>{
  for(const value of ['bytes=4096-','bytes=20-10','bytes=-0','bytes=0-1,3-4','bytes=x-y','items=0-1'])
    assert.equal(parseByteRange(value,4096),null,value);
  assert.equal(parseByteRange('bytes=0-',0),null);
  assert.equal(parseByteRange(undefined,4096),undefined);
});
