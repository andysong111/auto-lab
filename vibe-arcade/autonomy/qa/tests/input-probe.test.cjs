'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {reviewedTouchProbe,LEGACY_TOUCH_POINT}=require('../input-probe.cjs');

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
