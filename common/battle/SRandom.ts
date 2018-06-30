
// 伪随机序列: https://gist.github.com/lsenta/15d7f6fcfc2987176b54
class SRandom {
    private seed:number;
    constructor(seed:number) {
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

    public pick(collection:any[]):any {
        return collection[this.nextInt(0, collection.length - 1)];
    }
}