# Integration & Deployment Guide: Missed-Call Revenue Recovery

## 1. Supported Telephony Providers
* **Twilio Voice:** StatusCallback webhook (`CallStatus` event).
* **Telnyx Voice API:** `call.hangup` or `call.answered` webhooks.
* **Vonage / RingCentral:** Call log event subscription.

## 2. Configuration Parameters
```env
PORT=3002
BUSINESS_NAME="Apex Services"
BUSINESS_VERTICAL="CLINIC" # CLINIC, ROOFING, LEGAL, GENERAL
CALENDAR_URL="https://booking.apexservices.com/reserve"
TWILIO_ACCOUNT_SID=AC_xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+15125550100
```

## 3. Edge-Case Invariants
* **Answered Calls:** If `CallDuration > 0` or status is `completed`, recovery workflow stays idle.
* **Duplicate Call Spikes:** If the same number calls 3 times in 2 minutes, only 1 SMS is sent to prevent customer annoyance.
* **Carrier DND / Opt-Out:** Respects STOP / UNSUBSCRIBE keywords immediately.
