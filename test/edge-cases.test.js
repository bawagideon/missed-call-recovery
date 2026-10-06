const test = require('node:test');
const assert = require('node:assert/strict');
const { MissedCallEngine } = require('../src/index.js');

test('MissedCall Edge Cases: handles missing caller number without throwing', () => {
  const engine = new MissedCallEngine();
  const res = engine.processCallEvent({ callSid: 'c_null', callerNumber: '', callStatus: 'no-answer' });
  assert.equal(res.isMissed, true);
  assert.equal(res.recoveryStatus, 'PENDING');
  assert.equal(res.messageSent, null);
});

test('MissedCall Edge Cases: rejects malformed payload object', () => {
  const engine = new MissedCallEngine();
  assert.throws(() => engine.processCallEvent(null), /Invalid call event payload/);
});
