class Version {
    // 当前版本号
    public static currentVersion:number = 0.41;

    // 版本是否兼容
    public static isCompatible(oldVer:number) {
        return oldVer == Version.currentVersion;
    }
}
