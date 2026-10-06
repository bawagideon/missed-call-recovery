const test = require('node:test');
const assert = require('node:assert/strict');
const { MissedCallEngine, normalizePhone } = require('../src/index.js');

test('MissedCall: normalizePhone handles standard formats', () => {
  assert.equal(normalizePhone('(512) 555-0199'), '+15125550199');
  assert.equal(normalizePhone('15125550199'), '+15125550199');
  assert.equal(normalizePhone(''), '');
});

test('MissedCall: ignores answered calls with duration', () => {
  const engine = new MissedCallEngine();
  const res = engine.processCallEvent({
    callSid: 'c_1',
    callerNumber: '5125550123',
    callStatus: 'completed',
    durationSeconds: 145
  });

  assert.equal(res.isMissed, false);
  assert.equal(res.recoveryStatus, 'NOT_REQUIRED');
  assert.equal(res.messageSent, null);
});

test('MissedCall: triggers instant SMS recovery on no-answer', () => {
  const engine = new MissedCallEngine({ businessName: 'Austin Dental Care', businessType: 'CLINIC' });
  const res = engine.processCallEvent({
    callSid: 'c_2',
    callerNumber: '(512) 555-9876',
    callStatus: 'no-answer',
    durationSeconds: 0
  });

  assert.equal(res.isMissed, true);
  assert.equal(res.recoveryStatus, 'DISPATCHED');
  assert.ok(res.messageSent.includes('Austin Dental Care'));
  assert.ok(res.messageSent.includes('urgent appointment'));
  assert.ok(res.bookingUrl.includes('15125559876'));
});

test('MissedCall: metrics calculate accurate miss and recovery rates', () => {
  const engine = new MissedCallEngine();
  engine.processCallEvent({ callSid: 'c_1', callerNumber: '5125550111', callStatus: 'completed', durationSeconds: 60 });
  engine.processCallEvent({ callSid: 'c_2', callerNumber: '5125550222', callStatus: 'busy', durationSeconds: 0 });
  engine.processCallEvent({ callSid: 'c_3', callerNumber: '5125550333', callStatus: 'no-answer', durationSeconds: 0 });

  const metrics = engine.getMetrics();
  assert.equal(metrics.totalCalls, 3);
  assert.equal(metrics.missedCalls, 2);
  assert.equal(metrics.recoveredCalls, 2);
  assert.equal(metrics.missRate, 67);
  assert.equal(metrics.recoveryRate, 100);
});
