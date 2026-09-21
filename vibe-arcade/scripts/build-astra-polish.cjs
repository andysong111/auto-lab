/* Owner preview generator. P1 is preserved; P2 extends only the generated lab files. */
'use strict';
const path=require('node:path'),base=require('./build-astra-polish-p1.cjs');
function build(root=path.resolve(__dirname,'..'),{revision='p2'}={}){
 if(!['p1','p2'].includes(revision))throw Error('invalid_preview_revision');
 const output=base.build(root);
 if(revision==='p2')require('../preview/astra-polish/p2.cjs').build(output.dest);
 return {...output,version:revision==='p2'?'astra-polish-preview2':'astra-polish-preview1'};
}
if(require.main===module)console.log(JSON.stringify(build()));module.exports={build};
