// 抹掉按钮图上烤死的文字:btnRob.png(红字)与 lvBtnOk.png(深棕字),横向取样修补。
import fs from 'fs';
import { PNG } from 'pngjs';

function inpaint(file, isGlyph, inner, mirror) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width:W, height:H, data } = png;
  const idx=(x,y)=>(y*W+x)*4;
  // 标记文字像素
  const mark=new Uint8Array(W*H);
  for(let y=inner.y0;y<inner.y1;y++) for(let x=inner.x0;x<inner.x1;x++){
    const i=idx(x,y);
    if(data[i+3]>40 && isGlyph(data[i],data[i+1],data[i+2])) mark[y*W+x]=1;
  }
  // 膨胀 2px(盖住抗锯齿边)
  for(let pass=0;pass<2;pass++){
    const m2=new Uint8Array(mark);
    for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
      if(mark[y*W+x]) continue;
      if(mark[y*W+x-1]||mark[y*W+x+1]||mark[(y-1)*W+x]||mark[(y+1)*W+x]) m2[y*W+x]=1;
    }
    mark.set(m2);
  }
  // 横向修补:左右最近的非文字像素做线性插值
  let fixed=0;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    if(!mark[y*W+x]) continue;
    let xl=x-1; while(xl>=0&&mark[y*W+xl]) xl--;
    let xr=x+1; while(xr<W&&mark[y*W+xr]) xr++;
    const okL=xl>=0, okR=xr<W;
    const il=idx(Math.max(xl,0),y), ir=idx(Math.min(xr,W-1),y), o=idx(x,y);
    for(let c=0;c<4;c++){
      if(okL&&okR){ const t=(x-xl)/(xr-xl); data[o+c]=Math.round(data[il+c]*(1-t)+data[ir+c]*t); }
      else if(okL) data[o+c]=data[il+c];
      else if(okR) data[o+c]=data[ir+c];
    }
    fixed++;
  }
  const out=PNG.sync.write(png);
  fs.writeFileSync(file,out); fs.writeFileSync(mirror,out);
  console.log(file.split('/').pop(), W+'x'+H, 'inpainted px:', fixed);
}

// 抢劫:红字(r 明显高于 g/b),内区避开边框
inpaint('../client/resource/assets/ui/shop/btnRob.png',
  (r,g,b)=> r>90 && r>g*1.45 && r>b*1.45,
  {x0:12,y0:10,x1:107,y1:68},
  'public/resource/assets/ui/shop/btnRob.png');

// 确定:深棕字(低亮度),内区避开椭圆描边
inpaint('../client/resource/assets/ui/levelup/lvBtnOk.png',
  (r,g,b)=> (r+g+b)/3 < 105,
  {x0:22,y0:14,x1:133,y1:62},
  'public/resource/assets/ui/levelup/lvBtnOk.png');
