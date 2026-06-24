import fs from 'fs';
import { PNG } from 'pngjs';
const SRC = '../client/resource/assets/loading/LoadingBg.png';
const png = PNG.sync.read(fs.readFileSync(SRC));
const { width:W, height:H, data } = png;
// 烤死文字带 y 1060-1086;清除 y[1045,1105),用其上方 100px 的干净深色背景逐像素覆盖
const Y0=1045, Y1=1105, OFF=100;
function idx(x,y){ return (y*W + x)*4; }
for (let y=Y0; y<Y1; y++){
  for (let x=0; x<W; x++){
    const s=idx(x, y-OFF), d=idx(x,y);
    data[d]=data[s]; data[d+1]=data[s+1]; data[d+2]=data[s+2]; data[d+3]=data[s+3];
  }
}
const out = PNG.sync.write(png);
fs.writeFileSync(SRC, out);
fs.writeFileSync('public/resource/assets/loading/LoadingBg.png', out);
console.log('erased loading tip band y['+Y0+','+Y1+'); wrote client + public, '+(out.length/1024|0)+'KB');
