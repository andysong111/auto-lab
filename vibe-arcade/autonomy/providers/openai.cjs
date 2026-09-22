'use strict';
const {ProviderPause,modelError}=require('./errors.cjs');
const BASE='https://api.openai.com/v1/responses';
const responseId=id=>{if(!/^resp_[a-zA-Z0-9_-]{1,200}$/.test(id))throw new ProviderPause('invalid_provider_response_id');return id;};
async function readBounded(response,max,signal) {
  if(Number(response.headers.get('content-length')||0)>max){await response.body?.cancel().catch(()=>{});throw new ProviderPause('provider_response_too_large');}
  const reader=response.body.getReader();let bytes=0,chunks=[];
  try {while(true){if(signal?.aborted)throw signal.reason;const {done,value}=await reader.read();if(done)break;bytes+=value.length;if(bytes>max)throw new ProviderPause('provider_response_too_large');chunks.push(Buffer.from(value));}
    try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ProviderPause('provider_protocol_error');}
  } finally {await reader.cancel().catch(()=>{});}
}
const sleep=(ms,signal)=>new Promise((resolve,reject)=>{if(signal.aborted)return reject(signal.reason);const t=setTimeout(done,ms);function done(){signal.removeEventListener('abort',abort);resolve();}function abort(){clearTimeout(t);reject(signal.reason);}signal.addEventListener('abort',abort,{once:true});});
class OpenAIProvider {
  constructor({apiKey=process.env.OPENAI_API_KEY,model=process.env.FACTORY_OPENAI_MODEL,paidCallsAuthorized=process.env.FACTORY_ALLOW_PAID_CALLS==='1',fetchImpl=fetch,poll_ms=1500}={}) {
    this.apiKey=apiKey;this.model=model;this.authorized=paidCallsAuthorized;this.fetch=fetchImpl;this.poll=poll_ms;this.identity='openai-responses/'+(model||'unconfigured');
  }
  assertAvailable() {
    if(!this.apiKey||!this.model)throw new ProviderPause('provider_unavailable','OPENAI_API_KEY and FACTORY_OPENAI_MODEL are required');
    if(!this.authorized)throw new ProviderPause('paid_call_not_authorized');
    if(!/^[a-zA-Z0-9._:-]{1,100}$/.test(this.model))throw new ProviderPause('invalid_model');
  }
  async http(url,{method='GET',body,signal,max=1048576,operationId}={}) {
    let r;
    try {r=await this.fetch(url,{method,redirect:'error',signal,headers:{Authorization:'Bearer '+this.apiKey,'Content-Type':'application/json',...(operationId?{'X-Client-Request-Id':operationId}:{})},...(body?{body:JSON.stringify(body)}:{})});}
    catch(e){if(signal?.aborted)throw signal.reason;throw new ProviderPause('provider_network_error');}
    if(!r.ok){await r.body?.cancel().catch(()=>{});throw new ProviderPause([401,403,404].includes(r.status)?'provider_unavailable':r.status===429?'provider_rate_limited':r.status>=500?'provider_network_error':'provider_request_rejected');}
    return readBounded(r,max,signal);
  }
  async generate({request,instructions,schema,max_output_tokens,max_response_bytes,response_id,onResponseId,signal}) {
    this.assertAvailable();
    let response=response_id?await this.http(BASE+'/'+responseId(response_id),{signal,max:max_response_bytes}):await this.http(BASE,{method:'POST',signal,max:max_response_bytes,operationId:request.operation_id,
      body:{model:this.model,instructions,input:JSON.stringify(request),background:true,store:true,max_output_tokens,
        tools:[],text:{format:{type:'json_schema',name:'candidate_files',strict:true,schema}},metadata:{operation_id:request.operation_id,game_id:request.game_id}}});
    onResponseId(responseId(response.id));
    while(['queued','in_progress'].includes(response.status)) {await sleep(this.poll,signal);response=await this.http(BASE+'/'+responseId(response.id),{signal,max:max_response_bytes});}
    if(response.status!=='completed')throw modelError(response.status==='incomplete'?'model_output_incomplete':'model_failure');
    const messages=(response.output||[]).filter(x=>x.type==='message');
    if(messages.some(m=>(m.content||[]).some(c=>c.type==='refusal')))throw modelError('model_refusal');
    const texts=messages.flatMap(m=>m.content||[]).filter(c=>c.type==='output_text').map(c=>c.text);
    if(!texts.length)throw modelError('model_output_missing');
    return {output:texts.join(''),usage:response.usage||null};
  }
  async cancel(id) {this.assertAvailable();return this.http(BASE+'/'+responseId(id)+'/cancel',{method:'POST',signal:AbortSignal.timeout(5000)});}
}
module.exports={OpenAIProvider,readBounded};
