// 把用户的旗杆挂旗图标(约 700x870)面积平均缩到高 256,写入 client+public 的 assets/ui/flags/。
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
const SRC = 'C:/Users/c4389/Downloads/language_flag_icons_pack/language_flag_icons_pack/transparent_cropped';
const OUTS = ['../client/resource/assets/ui/flags', 'public/resource/assets/ui/flags'];
OUTS.forEach(d=>fs.mkdirSync(d,{recursive:true}));
const TH = 256;
for (const f of fs.readdirSync(SRC).filter(x=>/\.png$/i.test(x))) {
  const src = PNG.sync.read(fs.readFileSync(path.join(SRC,f)));
  const {width:SW,height:SH,data:sd}=src;
  const TW = Math.round(SW*TH/SH);
  const dst = new PNG({width:TW,height:TH});
  const dd = dst.data;
  for (let y=0;y<TH;y++){
    const sy0=y*SH/TH, sy1=(y+1)*SH/TH;
    for (let x=0;x<TW;x++){
      const sx0=x*SW/TW, sx1=(x+1)*SW/TW;
      let r=0,g=0,b=0,a=0,wsum=0;
      for(let sy=Math.floor(sy0);sy<Math.ceil(sy1);sy++){
        const wy=Math.min(sy+1,sy1)-Math.max(sy,sy0);
        for(let sx=Math.floor(sx0);sx<Math.ceil(sx1);sx++){
          const wx=Math.min(sx+1,sx1)-Math.max(sx,sx0);
          const w=wx*wy, i=(sy*SW+sx)*4, al=sd[i+3]/255;
          r+=sd[i]*w*al; g+=sd[i+1]*w*al; b+=sd[i+2]*w*al; a+=sd[i+3]*w; wsum+=w;
        }
      }
      const o=(y*TW+x)*4, am=a/wsum;
      const inv = am>0 ? 255/am : 0;
      dd[o]  =Math.min(255,Math.round(r/wsum*inv));
      dd[o+1]=Math.min(255,Math.round(g/wsum*inv));
      dd[o+2]=Math.min(255,Math.round(b/wsum*inv));
      dd[o+3]=Math.round(am);
    }
  }
  const buf=PNG.sync.write(dst);
  for(const d of OUTS) fs.writeFileSync(path.join(d,f), buf);
  console.log(f, SW+'x'+SH, '->', TW+'x'+TH, (buf.length/1024|0)+'KB');
}
