'use strict';
// Read-only PNG analysis of actual Chromium screenshots; never candidate canvas APIs.
const zlib=require('node:zlib');
function decode(b){
 if(!b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('PNG required');
 let w,h,channels,parts=[];
 for(let p=8;p+12<=b.length;){const n=b.readUInt32BE(p),t=b.toString('ascii',p+4,p+8),d=b.subarray(p+8,p+8+n);if(p+n+12>b.length)throw Error('truncated PNG');
  if(t==='IHDR'){w=d.readUInt32BE(0);h=d.readUInt32BE(4);channels=d[9]===6?4:d[9]===2?3:0;if(d[8]!==8||d[12]!==0||!channels||w*h>8000000)throw Error('unsupported PNG');}
  if(t==='IDAT')parts.push(d);p+=n+12;
 }
 if(!w||!h)throw Error('missing PNG header');const raw=zlib.inflateSync(Buffer.concat(parts),{maxOutputLength:(w*channels+1)*h}),stride=w*channels,data=Buffer.alloc(w*h*channels);
 if(raw.length!==(stride+1)*h)throw Error('PNG length');
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<h;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('PNG filter');for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?data[i-channels]:0,up=y?data[i-stride]:0,c=y&&x>=channels?data[i-stride-channels]:0;data[i]=(raw[y*(stride+1)+1+x]+[0,a,up,Math.floor((a+up)/2),paeth(a,up,c)][filter])&255;}}
 return {width:w,height:h,channels,data};
}
function sample(png,region,masks=[]){
 const {width,height,channels,data}=png,n=64,pixels=[],valid=[];
 if(region.x<0||region.y<0||region.x+region.width>width+1||region.y+region.height>height+1||region.width<4||region.height<4)throw Error('invalid visible screenshot region');
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const px=Math.min(width-1,Math.floor(region.x+(x+.5)*region.width/n)),py=Math.min(height-1,Math.floor(region.y+(y+.5)*region.height/n)),i=(py*width+px)*channels;
  pixels.push([data[i]/255,data[i+1]/255,data[i+2]/255]);valid.push(!masks.some(m=>px>=m.x-2&&py>=m.y-2&&px<=m.x+m.width+2&&py<=m.y+m.height+2));
 }
 return {pixels,valid,size:n};
}
const lum=p=>.2126*p[0]+.7152*p[1]+.0722*p[2];
function compare(a,b){
 let changed=0,total=0,delta=0,structure=0,edges=0;
 for(let i=0;i<a.pixels.length;i++)if(a.valid[i]&&b.valid[i]){
  const d=a.pixels[i].reduce((s,x,j)=>s+Math.abs(x-b.pixels[i][j]),0)/3;total++;delta+=d;if(d>.08)changed++;
  if(i%64&&a.valid[i-1]&&b.valid[i-1]){structure+=Math.abs((lum(a.pixels[i])-lum(a.pixels[i-1]))-(lum(b.pixels[i])-lum(b.pixels[i-1])));edges++;}
 }
 return {mean_delta:delta/Math.max(1,total),changed_fraction:changed/Math.max(1,total),structural_delta:structure/Math.max(1,edges),unmasked_fraction:total/a.pixels.length};
}
function distinct(m,limits){return m.unmasked_fraction>=.4&&m.mean_delta>=limits.delta&&m.changed_fraction>=limits.changed;}
function contrast(a,b){const mean=s=>s.pixels.filter((_,i)=>s.valid[i]).reduce((v,p)=>v+lum(p),0)/Math.max(1,s.valid.filter(Boolean).length),x=mean(a),y=mean(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
module.exports={decode,sample,compare,distinct,contrast};
