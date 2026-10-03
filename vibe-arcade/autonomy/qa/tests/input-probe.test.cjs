'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewedTouchProbe,LEGACY_TOUCH_POINT}=require('../input-probe.cjs');
const {progressChanged}=require('../worker.cjs');

test('technical touch probe uses the reviewed keyboard-equivalent touch binding',()=>{
  const manifest={qa:{keyboard:{key:'ArrowRight'}},product_contract:{actions:{
    shift_left:{key:'ArrowLeft',touch:{x:.1,y:.7}},
    shift_right:{key:'ArrowRight',touch:{x:.3,y:.7}},
    dash_right:{key:'ArrowUp',touch:{x:.7,y:.7}}
  }}};
  assert.deepEqual(reviewedTouchProbe(manifest),{action:'shift_right',point:{x:.3,y:.7},source:'reviewed_action'});
});

test('legacy technical fixtures retain the historical bounded touch point',()=>{
  assert.deepEqual(reviewedTouchProbe({qa:{keyboard:{key:'ArrowRight'}}}),{action:null,point:{...LEGACY_TOUCH_POINT},source:'legacy_probe'});
});

test('technical progress is cumulative across reviewed inputs, not an idle-only demand',()=>{
  const baseline={score:0,progress:0};
  assert.equal(progressChanged(baseline,{score:8,progress:0}),true);
  assert.equal(progressChanged(baseline,{score:0,progress:1}),true);
  assert.equal(progressChanged(baseline,{score:0,progress:0}),false);
});
