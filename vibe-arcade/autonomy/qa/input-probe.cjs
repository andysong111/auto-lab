'use strict';

const LEGACY_TOUCH_POINT=Object.freeze({x:.72,y:.55});

function finitePoint(value){
  return value&&Number.isFinite(value.x)&&Number.isFinite(value.y)&&value.x>=0&&value.x<=1&&value.y>=0&&value.y<=1;
}

function reviewedTouchProbe(manifest){
  const key=manifest?.qa?.keyboard?.key,actions=manifest?.product_contract?.actions;
  if(actions&&typeof actions==='object'){
    const match=Object.entries(actions).find(([,spec])=>spec?.key===key&&finitePoint(spec.touch));
    if(match)return {action:match[0],point:{x:match[1].touch.x,y:match[1].touch.y},source:'reviewed_action'};
  }
  return {action:null,point:{...LEGACY_TOUCH_POINT},source:'legacy_probe'};
}

module.exports={reviewedTouchProbe,LEGACY_TOUCH_POINT};
