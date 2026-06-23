// ============================================================================
// Egret -> PixiJS shim : TEXT
// TextField, HtmlTextParser, BitmapFont, BitmapText
// ============================================================================

namespace egret {

    export interface ITextElement { text: string; style?: any; }

    // ---- HtmlTextParser : strip/convert egret rich-text markup ------------
    export class HtmlTextParser {
        public parser(htmltext: string): ITextElement[] {
            if (htmltext == null) return [{ text: "" }];
            const out: ITextElement[] = [];
            const styleStack: any[] = [{}];
            let i = 0;
            const re = /<\/?[^>]+>/g;
            let m: RegExpExecArray | null;
            let last = 0;
            const push = (txt: string) => {
                if (!txt) return;
                out.push({ text: txt, style: Object.assign({}, styleStack[styleStack.length - 1]) });
            };
            while ((m = re.exec(htmltext))) {
                push(htmltext.substring(last, m.index));
                last = re.lastIndex;
                const tag = m[0];
                if (tag[1] === "/") {
                    if (styleStack.length > 1) styleStack.pop();
                } else {
                    const cur = Object.assign({}, styleStack[styleStack.length - 1]);
                    const lower = tag.toLowerCase();
                    if (lower.indexOf("<b") === 0) cur.bold = true;
                    if (lower.indexOf("<i") === 0) cur.italic = true;
                    if (lower.indexOf("<u") === 0) cur.underline = true;
                    const cm = /color\s*=\s*['"]?#?([0-9a-fA-F]{6})/.exec(tag);
                    if (cm) cur.textColor = parseInt(cm[1], 16);
                    const sm = /size\s*=\s*['"]?(\d+)/.exec(tag);
                    if (sm) cur.size = parseInt(sm[1], 10);
                    styleStack.push(cur);
                }
            }
            push(htmltext.substring(last));
            if (out.length === 0) out.push({ text: "" });
            return out;
        }
    }

    // ---- TextField --------------------------------------------------------
    export class TextField extends DisplayObjectContainer {
        // 全局 UI 默认字体栈。游戏按当前语言设置(见 ViewUtils.applyUIFont)：栈末尾留系统
        // 字体，使日/韩/西里尔等无 bundled 字体时也能由操作系统字体渲染(不出豆腐块)。
        public static defaultFontFamily = "LXGW WenKai, Microsoft YaHei, sans-serif";
        private _t: any;                 // PIXI.Text
        private _text = "";
        private _flow: ITextElement[] | undefined;
        private _size = 30;
        private _color = 0xffffff;
        private _family = TextField.defaultFontFamily;
        private _bold = false;
        private _italic = false;
        private _align = HorizontalAlign.LEFT;
        private _valign = VerticalAlign.TOP;
        private _lineSpacing = 0;
        private _stroke = 0;
        private _strokeColor = 0x000000;
        private _bw: number | undefined;
        private _bh: number | undefined;
        private _runs: any[] = [];        // per-segment PIXI.Text pieces (rich mode)
        private _cw = 0;                  // measured content width  (rich mode)
        private _ch = 0;                  // measured content height (rich mode)
        private _type = TextFieldType.DYNAMIC;
        private _inputTapHooked = false;
        public inputType = TextFieldInputType.TEXT;
        public maxChars = 0;
        public displayAsPassword = false;
        public background = false;
        public backgroundColor = 0xffffff;
        public border = false;

        constructor() {
            super();
            this._t = new PIXI.Text("", this.buildStyle());
            super.addChild(this._t);
        }

        public get type(): string { return this._type; }
        public set type(v: string) {
            this._type = v;
            if (v === TextFieldType.INPUT && !this._inputTapHooked) {
                this._inputTapHooked = true;
                (this as any).eventMode = "static";
                (this as any).on("pointertap", () => this.openHtmlInput());
            }
        }

        // Overlay a real positioned HTML <input> over this field so the user can type.
        // On blur/Enter the value is synced back to .text. (egret INPUT TextField.)
        private _htmlInput: any;
        private openHtmlInput() {
            const app = (egret as any).$app;
            if (!app || typeof document === "undefined") return;
            if (this._htmlInput && this._htmlInput.parentNode) { this._htmlInput.focus(); return; }
            const canvas: HTMLCanvasElement = app.view;
            const rect = canvas.getBoundingClientRect();
            const tl = this.toGlobal(new PIXI.Point(0, 0));
            const sx = rect.width / (canvas.width || 1);
            const sy = rect.height / (canvas.height || 1);
            const boxW = (this.width || 200);
            const boxH = (this.height || this._size + 12);

            const input = document.createElement("input");
            input.type = this.displayAsPassword ? "password" : "text";
            input.value = this._text || "";
            if (this.maxChars > 0) input.maxLength = this.maxChars;
            const st = input.style;
            st.position = "absolute";
            st.left = (rect.left + tl.x * sx) + "px";
            st.top = (rect.top + tl.y * sy) + "px";
            st.width = (boxW * sx) + "px";
            st.height = (boxH * sy) + "px";
            st.fontSize = (this._size * sy) + "px";
            st.fontFamily = this._family;
            st.textAlign = "center";
            st.color = "#" + ("000000" + this._color.toString(16)).slice(-6);
            st.border = "none";
            st.outline = "none";
            st.background = "transparent";
            st.padding = "0";
            st.margin = "0";
            st.zIndex = "10000";
            document.body.appendChild(input);
            this._htmlInput = input;
            input.focus();
            try { input.select(); } catch (e) {}

            const commit = () => {
                if (!input.parentNode) return;
                this.text = input.value;
                this.dispatchEventWith(Event.CHANGE);
                document.body.removeChild(input);
                if (this._htmlInput === input) this._htmlInput = undefined;
            };
            input.addEventListener("blur", commit);
            input.addEventListener("keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter") { e.preventDefault(); input.blur(); }
            });
            input.addEventListener("input", () => { this._text = input.value; this.update(); });
        }

        // egret API some views may call; ensure overlay text reflects programmatic set
        public setText(v: string) { this.text = v; if (this._htmlInput) this._htmlInput.value = v || ""; }

        private buildStyle(): any {
            const s: any = {
                fontFamily: this._family,
                fontSize: this._size,
                fill: this._color,
                align: this._align,
                leading: this._lineSpacing,
                fontWeight: this._bold ? "bold" : "normal",
                fontStyle: this._italic ? "italic" : "normal",
                // egret advances each line by the FONT SIZE (+lineSpacing); PIXI defaults
                // to the font's ascent+descent (~1.27x the size), so multi-line text was
                // ~27% too tall and overflowed/overlapped egret-designed boxes (e.g. the
                // occupation description spilling onto the relic line). lineHeight=size
                // restores egret's tight line metric; `leading` adds lineSpacing on top.
                lineHeight: this._size,
            };
            if (this._stroke) { s.stroke = this._strokeColor; s.strokeThickness = this._stroke * 2; }
            if (this._bw !== undefined) { s.wordWrap = true; s.wordWrapWidth = this._bw; s.breakWords = true; }
            return s;
        }

        private clearRuns() {
            if (!this._runs.length) return;
            for (const p of this._runs) { if (p.parent) super.removeChild(p); try { p.destroy(); } catch (e) {} }
            this._runs.length = 0;
            this._cw = 0; this._ch = 0;
        }

        private isRich(): boolean {
            return !!this._flow && this._flow.some(e => e.style &&
                (e.style.textColor !== undefined || e.style.size !== undefined || e.style.bold || e.style.italic));
        }

        private update() {
            this.clearRuns();

            if (this.isRich()) { this._t.visible = false; this.layoutRich(); return; }

            // ---- single-style fast path ----
            this._t.visible = true;
            this._t.style = this.buildStyle();
            this._t.text = this._text || "";

            // Horizontal alignment within the EXPLICIT width box. egret aligns the text
            // inside its width box; PIXI.Text's style.align only aligns wrapped lines
            // within their OWN bounds (maxLineWidth), so the whole block must be offset
            // to sit in the box — exactly what layoutRich() does for the rich path.
            // (Without this, every center/right field rendered flush-left: createTextField
            // defaults to CENTER, so nearly all UI labels were mis-positioned.)
            if (this._bw !== undefined) {
                if (this._align === HorizontalAlign.CENTER) this._t.x = (this._bw - this._t.width) / 2;
                else if (this._align === HorizontalAlign.RIGHT) this._t.x = this._bw - this._t.width;
                else this._t.x = 0;
            } else {
                this._t.x = 0;
            }

            if (this._bh !== undefined) {
                if (this._valign === VerticalAlign.MIDDLE) this._t.y = (this._bh - this._t.height) / 2;
                else if (this._valign === VerticalAlign.BOTTOM) this._t.y = this._bh - this._t.height;
                else this._t.y = 0;
            } else {
                this._t.y = 0;
            }
        }

        // per-run style = field defaults overlaid with the segment's own style
        private styleFor(st: any): any {
            st = st || {};
            const sz = st.size != null ? st.size : this._size;
            const o: any = {
                fontFamily: this._family,
                fontSize: sz,
                fill: st.textColor != null ? st.textColor : this._color,
                fontWeight: (st.bold || this._bold) ? "bold" : "normal",
                fontStyle: (st.italic || this._italic) ? "italic" : "normal",
                // match egret's per-line advance (= font size, not ascent+descent) so a
                // per-token piece measures `size` tall; layoutRich then stacks lines at the
                // egret height instead of PIXI's inflated metric. (see buildStyle note)
                lineHeight: sz,
            };
            if (this._stroke) { o.stroke = this._strokeColor; o.strokeThickness = this._stroke * 2; }
            return o;
        }

        // split into layout tokens: each CJK char, each latin "word", each whitespace run
        private tokenize(text: string): string[] {
            const tokens: string[] = [];
            const cjk = "\\u3000-\\u303f\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff\\uff00-\\uffef";
            const re = new RegExp("[" + cjk + "]|[^\\s" + cjk + "]+|\\s+", "g");
            for (const part of text.split(/(\n)/)) {
                if (part === "\n") { tokens.push("\n"); continue; }
                let m: RegExpExecArray | null;
                while ((m = re.exec(part))) tokens.push(m[0]);
            }
            return tokens;
        }

        // multi-style layout with word/CJK wrapping + h/v alignment inside the box
        private layoutRich() {
            const wrap = this._bw != null ? this._bw : Infinity;
            const items: Array<{ tk: string; style: any }> = [];
            for (const seg of this._flow!) for (const tk of this.tokenize(seg.text)) items.push({ tk, style: seg.style });

            // `h` = measured piece height (PIXI ~1.27x size) used only to bottom-align
            // mixed-size tokens WITHIN a line. `adv` = egret line advance (= max token
            // SIZE), used to stack lines — PIXI's measured height would make multi-line
            // rich text ~27% too tall and overflow its box (each piece is single-line, so
            // lineHeight can't shrink it; the advance must come from the size instead).
            const lines: Array<{ pieces: any[]; w: number; h: number; adv: number }> = [];
            let cur: any[] = [], x = 0, lineH = 0, lineAdv = 0;
            const pushLine = () => { lines.push({ pieces: cur, w: x, h: lineH || this._size, adv: lineAdv || this._size }); cur = []; x = 0; lineH = 0; lineAdv = 0; };

            for (const it of items) {
                if (it.tk === "\n") { pushLine(); continue; }
                const isSpace = /^\s+$/.test(it.tk);
                const piece: any = new PIXI.Text(it.tk, this.styleFor(it.style));
                const w = piece.width, h = piece.height;
                const sz = (it.style && it.style.size != null) ? it.style.size : this._size;
                if (wrap !== Infinity && x > 0 && x + w > wrap && !isSpace) pushLine();
                if (x === 0 && isSpace) { try { piece.destroy(); } catch (e) {} continue; } // drop leading space
                piece.x = x; piece.__h = h; cur.push(piece);
                x += w; if (h > lineH) lineH = h; if (sz > lineAdv) lineAdv = sz;
            }
            pushLine();

            let y = 0, maxW = 0;
            for (const ln of lines) {
                let off = 0;
                if (this._bw != null) {
                    if (this._align === HorizontalAlign.CENTER) off = (this._bw - ln.w) / 2;
                    else if (this._align === HorizontalAlign.RIGHT) off = this._bw - ln.w;
                }
                // Within the line, bottom-align mixed-size tokens by their MEASURED height
                // (baseline-ish). Advance to the next line by the egret SIZE so the taller
                // PIXI metric's descent just overhangs the gap (empty for CJK), matching
                // egret's tight line packing instead of stacking 38px boxes.
                for (const p of ln.pieces) { p.x += off; p.y = y + (ln.h - p.__h); super.addChild(p); this._runs.push(p); }
                y += ln.adv + this._lineSpacing;
                if (ln.w > maxW) maxW = ln.w;
            }
            this._cw = this._bw != null ? this._bw : maxW;
            this._ch = y > 0 ? y - this._lineSpacing : 0;

            if (this._bh != null) {
                let vo = 0;
                if (this._valign === VerticalAlign.MIDDLE) vo = (this._bh - this._ch) / 2;
                else if (this._valign === VerticalAlign.BOTTOM) vo = this._bh - this._ch;
                if (vo) for (const p of this._runs) p.y += vo;
            }
        }

        public get text(): string { return this._text; }
        public set text(v: string) { this._text = (v == null ? "" : "" + v); this._flow = undefined; this.update(); }

        public get textFlow(): ITextElement[] | undefined { return this._flow; }
        public set textFlow(flow: ITextElement[] | undefined) {
            this._flow = flow;
            this._text = flow ? flow.map(e => e.text).join("") : "";
            this.update(); // multi-style flows render as colored runs (see layoutRich)
        }

        public get size(): number { return this._size; }
        public set size(v: number) { if (v) { this._size = v; this.update(); } }
        public get textColor(): number { return this._color; }
        public set textColor(v: number) { this._color = v; this.update(); }
        public get fontFamily(): string { return this._family; }
        public set fontFamily(v: string) { this._family = v; this.update(); }
        public get bold(): boolean { return this._bold; }
        public set bold(v: boolean) { this._bold = v; this.update(); }
        public get italic(): boolean { return this._italic; }
        public set italic(v: boolean) { this._italic = v; this.update(); }
        public get textAlign(): string { return this._align; }
        public set textAlign(v: string) { this._align = v; this.update(); }
        public get verticalAlign(): string { return this._valign; }
        public set verticalAlign(v: string) { this._valign = v; this.update(); }
        public get lineSpacing(): number { return this._lineSpacing; }
        public set lineSpacing(v: number) { this._lineSpacing = v; this.update(); }
        public get stroke(): number { return this._stroke; }
        public set stroke(v: number) { this._stroke = v; this.update(); }
        public get strokeColor(): number { return this._strokeColor; }
        public set strokeColor(v: number) { this._strokeColor = v; this.update(); }
        public get lineHeight(): number { return this._t.style.lineHeight || this._size; }

        // egret TextField width/height define the layout box (no scaling).
        public get width(): number { return this._bw !== undefined ? this._bw : (this._runs.length ? this._cw : this._t.width); }
        public set width(v: number) { this._bw = v; this.update(); }
        public get height(): number { return this._bh !== undefined ? this._bh : (this._runs.length ? this._ch : this._t.height); }
        public set height(v: number) { this._bh = v; this.update(); }
        public get textWidth(): number { return this._runs.length ? this._cw : this._t.width; }
        public get textHeight(): number { return this._runs.length ? this._ch : this._t.height; }
        public get measuredWidth(): number { return this._runs.length ? this._cw : this._t.width; }
        public get measuredHeight(): number { return this._runs.length ? this._ch : this._t.height; }
        public get numLines(): number { return this._text ? this._text.split("\n").length : 0; }

        public setFocus() {}
    }

    // ---- BitmapFont -------------------------------------------------------
    export class BitmapFont {
        private base: any;
        private frames: any;
        private cache: { [c: string]: any } = {};
        constructor(texture: Texture, config: any) {
            this.base = texture && texture.$pixiTexture ? texture.$pixiTexture.baseTexture : null;
            this.frames = (config && config.frames) ? config.frames : config;
        }
        public getFrame(ch: string): any { return this.frames ? this.frames[ch] : undefined; }
        public getTexture(ch: string): any {
            if (this.cache[ch]) return this.cache[ch];
            const f = this.getFrame(ch);
            if (!f || !this.base) return null;
            const t = new PIXI.Texture(this.base, new PIXI.Rectangle(f.x, f.y, f.w, f.h));
            this.cache[ch] = t;
            return t;
        }
    }

    // ---- BitmapText -------------------------------------------------------
    export class BitmapText extends DisplayObjectContainer {
        private _font: BitmapFont | undefined;
        private _text = "";
        public letterSpacing = 0;
        public lineSpacing = 0;
        public textAlign = HorizontalAlign.LEFT;
        public smoothing = true;

        // Optional outline/stroke (bitmap fonts can't be stroked, so we draw dark tinted
        // duplicates of each glyph offset in 8 directions BEHIND the main glyphs). Off by
        // default; set both to enable. Used to make the cooldown number readable.
        private _outlineColor: number | undefined = undefined;
        private _outlineSize = 0;
        public get outlineColor(): number | undefined { return this._outlineColor; }
        public set outlineColor(v: number | undefined) { this._outlineColor = v; this.rebuild(); }
        public get outlineSize(): number { return this._outlineSize; }
        public set outlineSize(v: number) { this._outlineSize = v; this.rebuild(); }

        public get font(): BitmapFont | undefined { return this._font; }
        public set font(f: BitmapFont | undefined) { this._font = f; this.rebuild(); }
        public get text(): string { return this._text; }
        public set text(v: string) { this._text = (v == null ? "" : "" + v); this.rebuild(); }

        private rebuild() {
            this.removeChildren();
            if (!this._font || !this._text) return;
            // collect glyph placements first so the outline pass can sit fully behind all glyphs
            const glyphs: Array<{ tex: any; x: number; y: number }> = [];
            let cursorX = 0;
            let lineY = 0;
            for (const ch of this._text) {
                if (ch === "\n") { cursorX = 0; lineY += this.lineHeightGuess(); continue; }
                const f = this._font.getFrame(ch);
                const tex = this._font.getTexture(ch);
                if (!f || !tex) { cursorX += this._size() / 2; continue; }
                glyphs.push({ tex, x: cursorX + (f.offX || 0), y: lineY + (f.offY || 0) });
                cursorX += (f.sourceW || f.w) + this.letterSpacing;
            }
            // outline pass: dark tinted copies in 8 directions, drawn first (behind)
            if (this._outlineColor !== undefined && this._outlineColor !== null && this._outlineSize > 0) {
                const s = this._outlineSize;
                const offs = [[-s, -s], [0, -s], [s, -s], [-s, 0], [s, 0], [-s, s], [0, s], [s, s]];
                for (const g of glyphs) {
                    for (const o of offs) {
                        const sp = new PIXI.Sprite(g.tex);
                        sp.x = g.x + o[0]; sp.y = g.y + o[1];
                        sp.tint = this._outlineColor;
                        super.addChild(sp);
                    }
                }
            }
            // main glyphs on top
            for (const g of glyphs) {
                const spr = new PIXI.Sprite(g.tex);
                spr.x = g.x; spr.y = g.y;
                super.addChild(spr);
            }
        }
        private _size(): number { return 24; }
        private lineHeightGuess(): number {
            // any frame's sourceH
            const fr = (this._font as any) && (this._font as any).frames;
            if (fr) for (const k in fr) return (fr[k].sourceH || fr[k].h) + this.lineSpacing;
            return 24;
        }
    }
}
