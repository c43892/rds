
// 伪随机序列: https://gist.github.com/lsenta/15d7f6fcfc2987176b54
class SRandom {
    private seed:number;
    constructor(seed:number = undefined) {
        seed = (seed == undefined) ? Date.now() : seed;
        this.seed = seed;
    }

    private next(min:number, max:number):number {
        max = max || 0;
        min = min || 0;

        this.seed = (this.seed * 9301 + 49297) % 233280;
        var rnd = this.seed / 233280;

        return min + rnd * (max - min);
    }

    // http://indiegamr.com/generate-repeatable-random-numbers-in-js/
    public nextInt(min:number, max:number):number {
        return Math.floor(this.next(min, max));
    }

    public next100():number {
        return this.nextInt(0, 100);
    }

    public nextDouble(min = 0, max = 1):number {
        return this.next(min, max);
    }

    public select(collection) {
        return collection[this.nextInt(0, collection.length)];
    }

    public selectN(collection, n:number) {
        if (n == 1) return [this.select(collection)];

        var sels = [...collection];
        var rs = [];
        for (var i = 0; i < n && i < sels.length; i++) {
            var rn = this.nextInt(0, sels.length - i);
            rs.push(sels[rn]);
            var tmp = sels[rn];
            sels[rn] = sels[sels.length - i - 1];
            sels[sels.length - i - 1] = tmp;
        }

        return rs;
    }

    public toString():string {
        return this.seed.toString();
    }

    public static fromString(str) : SRandom {
        var seed = Number(str);
        return new SRandom(seed);
    }
}