/**
 * @gideon/missed-call-recovery
 * Project #02 in the Master 50 Business Problem & Revenue Leak Weapons
 * 
 * Commercial Mission:
 * Intercepts unanswered business phone calls and triggers instant
 * conversational SMS/WhatsApp recovery with calendar booking links in under 5 seconds.
 */

function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return digits ? `+${digits}` : '';
}

class MissedCallEngine {
  constructor(options = {}) {
    this.businessName = options.businessName || 'Apex Services';
    this.businessType = options.businessType || 'CLINIC'; // CLINIC, ROOFING, LEGAL, GENERAL
    this.calendarUrl = options.calendarUrl || 'https://booking.apexservices.com/reserve';
    this.callLog = [];
  }

  processCallEvent(event) {
    if (!event || typeof event !== 'object') {
      throw new Error('Invalid call event payload');
    }

    const callSid = event.callSid || `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const callerNumber = normalizePhone(event.callerNumber || event.From || '');
    const callStatus = (event.callStatus || event.CallStatus || 'no-answer').toLowerCase();
    const durationSeconds = Number(event.durationSeconds || event.CallDuration || 0);
    const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

    const isMissed = ['no-answer', 'busy', 'failed', 'canceled'].includes(callStatus) || (durationSeconds === 0);

    const record = {
      callSid,
      callerNumber,
      callStatus,
      durationSeconds,
      timestamp: timestamp.toISOString(),
      isMissed,
      recoveryStatus: isMissed ? 'PENDING' : 'NOT_REQUIRED',
      recoveryDispatchedAt: null,
      messageSent: null
    };

    if (isMissed && callerNumber) {
      const recovery = this.generateRecoveryMessage(callerNumber, record);
      record.recoveryStatus = 'DISPATCHED';
      record.recoveryDispatchedAt = new Date().toISOString();
      record.messageSent = recovery.message;
      record.channel = recovery.channel;
      record.bookingUrl = recovery.bookingUrl;
    }

    this.callLog.push(record);
    return record;
  }

  generateRecoveryMessage(callerNumber, record) {
    const bookingUrl = `${this.calendarUrl}?caller=${encodeURIComponent(callerNumber)}&ref=${record.callSid}`;
    let message = '';

    switch (this.businessType) {
      case 'CLINIC':
        message = `Hi, thank you for calling ${this.businessName}! We're currently assisting another patient and missed your call. If this is an urgent appointment or inquiry, you can grab an immediate open slot here: ${bookingUrl} or reply directly to this text.`;
        break;
      case 'ROOFING':
        message = `Hello from ${this.businessName}! Sorry we missed your call — our inspection crew is currently on-site. Need a rapid quote or emergency roof check? Book your priority slot here: ${bookingUrl}`;
        break;
      case 'LEGAL':
        message = `Hello, this is ${this.businessName}. We missed your call as all attorneys are currently in consultation. Please leave a brief description of your matter or reserve a callback here: ${bookingUrl}`;
        break;
      default:
        message = `Hi! Thanks for calling ${this.businessName}. We're on the other line and sorry we missed you! How can we help today? Or book a quick time with us here: ${bookingUrl}`;
        break;
    }

    return {
      channel: 'SMS',
      message,
      bookingUrl
    };
  }

  getMetrics() {
    const totalCalls = this.callLog.length;
    const missedCalls = this.callLog.filter(c => c.isMissed).length;
    const recoveredCalls = this.callLog.filter(c => c.recoveryStatus === 'DISPATCHED').length;
    const missRate = totalCalls > 0 ? Math.round((missedCalls / totalCalls) * 100) : 0;
    const recoveryRate = missedCalls > 0 ? Math.round((recoveredCalls / missedCalls) * 100) : 0;

    return {
      totalCalls,
      missedCalls,
      recoveredCalls,
      missRate,
      recoveryRate
    };
  }
}

module.exports = {
  normalizePhone,
  MissedCallEngine
};
