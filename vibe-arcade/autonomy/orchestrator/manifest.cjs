'use strict';
const Ajv = require('ajv');
const schema = require('../schema/game-manifest.schema.json');
const validateSchema = new Ajv({allErrors: true, strict: false}).addSchema(require('../schema/product-quality-contract.schema.json')).addSchema(require('../schema/commercial-polish-contract.schema.json')).compile(schema);
const transitions = Object.freeze({
  IDEA: ['SPEC_READY', 'REJECTED'], SPEC_READY: ['BUILDING', 'REJECTED'],
  BUILDING: ['QA_RUNNING', 'BUILD_FAILED', 'REJECTED'], BUILD_FAILED: ['REPAIR_PENDING', 'REJECTED'],
  QA_RUNNING: ['QA_FAILED', 'QUALITY_GATE', 'REJECTED'], QA_FAILED: ['REPAIR_PENDING', 'REJECTED'],
  REPAIR_PENDING: ['REPAIRING', 'REJECTED'], REPAIRING: ['QA_RUNNING', 'BUILD_FAILED', 'REJECTED'],
  QUALITY_GATE: ['RC_READY', 'QUALITY_FAILED', 'REJECTED'], QUALITY_FAILED: ['REPAIR_PENDING', 'REJECTED'],
  RC_READY: ['PREVIEW_DEPLOYING', 'QA_RUNNING', 'REJECTED'],
  PREVIEW_DEPLOYING: ['PREVIEW_SMOKE', 'QA_RUNNING', 'REJECTED'],
  PREVIEW_SMOKE: ['READY_TO_SHIP', 'QA_FAILED', 'QA_RUNNING', 'REJECTED'],
  READY_TO_SHIP: ['ARCHIVED', 'QA_RUNNING', 'REJECTED'], REJECTED: ['ARCHIVED'], ARCHIVED: []
});
function validate(m) {
  if (!validateSchema(m)) throw Error('invalid_manifest: ' + JSON.stringify(validateSchema.errors));
  if (m.commercial_contract) require('../qa/commercial/contract.cjs').validate(m.commercial_contract);
  if (m.product_contract) require('../qa/product-contract.cjs').validate(m.product_contract);
  if (m.source_path !== `autonomy/games/${m.game_id}/${m.version}`) throw Error('invalid_manifest: source identity');
  if (m.repair_attempt > m.max_repair_attempts) throw Error('invalid_manifest: repair budget');
  if (!Number.isFinite(Date.parse(m.created_at))) throw Error('invalid_manifest: created_at');
  return m;
}
function transition(m, next, details = {}) {
  validate(m);
  if (!transitions[m.state]?.includes(next)) throw Error(`invalid_transition: ${m.state} -> ${next}`);
  if (next === 'REPAIR_PENDING' && m.repair_attempt >= m.max_repair_attempts) throw Error('repair_budget_exhausted');
  const result = {...m, state: next, revision: m.revision + 1,
    history: [...m.history, {from: m.state, to: next, at: new Date().toISOString(), ...details}]};
  return validate(result);
}
function create(spec) {
  const id = spec.game_id;
  return validate({schema_version: 1, game_id: id, generation: spec.generation ?? 1,
    version: 'v1', title: spec.title, slug: spec.slug, genre: spec.genre, mechanic_family: spec.mechanic_family, render_runtime: spec.render_runtime||'canvas',
    controls: spec.controls, mobile_controls: spec.mobile_controls,
    reference_quality_games: ['astra-sentinel-v3', 'deep-descent'], created_at: new Date().toISOString(),
    state: 'IDEA', repair_attempt: 0, max_repair_attempts: spec.max_repair_attempts ?? 5,
    source_path: `autonomy/games/${id}/v1`, preview_url: null, qa_status: 'PENDING', quality_status: 'PENDING',
    release_status: 'NONE', failure_reasons: [], metrics_eligibility: false,
    qa: spec.qa, ...(spec.commercial_contract?{commercial_contract:spec.commercial_contract,commercial_qa_status:'PENDING'}:{}), ...(spec.product_contract?{product_contract:spec.product_contract,technical_qa_status:'PENDING',product_qa_status:'PENDING'}:{}), revision: 0, history: []});
}
module.exports = {validate, transition, create, transitions};
