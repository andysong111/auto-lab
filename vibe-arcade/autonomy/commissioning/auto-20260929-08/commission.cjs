'use strict';
const {main}=require('../../cycle/template-runner.cjs');
main(__dirname,process.argv[2]).catch(e=>{console.error(e.stack||e);process.exitCode=1;});
