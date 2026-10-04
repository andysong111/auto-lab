'use strict';

const AUTHORIZED_SEQUENCE = 38;

function authorize(actor, owner, requestedSequence, nextSequence) {
  const requested = Number(requestedSequence);
  const next = Number(nextSequence);
  if (!requestedSequence) return { allowed: false, reason: 'not_requested' };
  if (!actor || actor !== owner) return { allowed: false, reason: 'repository_owner_required' };
  if (!Number.isInteger(requested) || requested !== AUTHORIZED_SEQUENCE) {
    return { allowed: false, reason: 'sequence_not_authorized' };
  }
  if (!Number.isInteger(next) || requested !== next) {
    return { allowed: false, reason: 'sequence_no_longer_next' };
  }
  return { allowed: true, reason: 'owner_one_time_sequence_38' };
}

if (require.main === module) {
  const [, , actor, owner, requestedSequence, nextSequence] = process.argv;
  process.stdout.write(`${JSON.stringify(authorize(actor, owner, requestedSequence, nextSequence))}\n`);
}

module.exports = { AUTHORIZED_SEQUENCE, authorize };
