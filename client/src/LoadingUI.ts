//////////////////////////////////////////////////////////////////////////////////////
//
//  Copyright (c) 2014-present, Egret Technology.
//  All rights reserved.
//  Redistribution and use in source and binary forms, with or without
//  modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright
//       notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//     * Neither the name of the Egret nor the
//       names of its contributors may be used to endorse or promote products
//       derived from this software without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY EGRET AND CONTRIBUTORS "AS IS" AND ANY EXPRESS
//  OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
//  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL EGRET AND CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
//  INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
//  LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;LOSS OF USE, DATA,
//  OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
//  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
//////////////////////////////////////////////////////////////////////////////////////

class LoadingUI extends egret.DisplayObjectContainer implements RES.PromiseTaskReporter {

    // 进度条左起坐标和全宽
    sx = 72;
    sy = 1039;
    fw = 615;

    // 刷新界面显示
    bg:egret.Bitmap;
    loadingBar:egret.Bitmap;
    ghost:egret.Bitmap;

    public refresh() {
        this.removeChildren();

        // 背景
        this.bg = ViewUtils.createBitmapByName("LoadingBg_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.addChild(this.bg);

        // 进度条
        this.loadingBar = ViewUtils.createBitmapByName("LoadingBar_png");
        this.loadingBar.x = this.sx;
        this.loadingBar.y = this.sy;
        this.loadingBar.width = 0;
        this.addChild(this.loadingBar);

        // 进度条上的幽灵
        this.ghost = ViewUtils.createBitmapByName("LoadingGhost_png");
        this.ghost.anchorOffsetX = this.ghost.width / 2;
        this.ghost.anchorOffsetY = this.ghost.height / 2;
        this.ghost.x = this.sx;
        this.ghost.y = this.sy;
        this.addChild(this.ghost);
    }

    onProgress(current: number, total: number): void {
        this.setProgress(current / total * (this.gsn + 1) / this.gs.length);
    }

    // 加载指定资源组
    gs;
    gsn;
    public async loadResGroups(...gs) {
        this.gs = gs;
        this.gsn = 0;
        for (this.gsn = 0; this.gsn < this.gs.length; this.gsn++)
            await RES.loadGroup(this.gs[this.gsn], 0, this);
    }

    // 手动设置为 100% 
    public setProgress(p) {
        let w = this.fw * p;
        if (this.loadingBar) {
            this.loadingBar.width = w;
            this.ghost.x = this.loadingBar.x + this.loadingBar.width;
        }
    }
}
