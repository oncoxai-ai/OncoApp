const test = require('node:test');
const assert = require('node:assert/strict');

const serverModule = require('../server');

test('validatePatient rejects missing field', () => {
  const err = serverModule.validatePatient({ name: 'x' });
  assert.match(err, /Missing field/);
});

test('validatePatient rejects bad date', () => {
  const err = serverModule.validatePatient({
    name: 'Ali',
    cancer_type: 'Lenfoma',
    stage: 'II',
    last_checkup: '26-02-2026',
    treatment_plan: 'İlaç',
  });
  assert.match(err, /Invalid date format/);
});

test('validatePatient accepts valid payload', () => {
  const err = serverModule.validatePatient({
    name: 'Ali',
    cancer_type: 'Lenfoma',
    stage: 'II',
    last_checkup: '2026-02-26',
    treatment_plan: 'İlaç',
  });
  assert.equal(err, null);
});
