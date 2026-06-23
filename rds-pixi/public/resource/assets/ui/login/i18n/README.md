# 登录按钮 - 各语言成品图放这里

游戏会优先加载本目录下对应语言的按钮图;不存在则回退为运行时生成的木质按钮。

命名规则(严格匹配,区分大小写):  <底图名>_<语言码>.png
语言码:CNS(简中) CNT(繁中) JA KO ES FR DE PT RU  (EN 用原图,无需放这里)

需要的 4 个底图名与尺寸(PNG,带透明通道,尺寸需与原图一致):
  NewGameNormal_<LANG>.png      318 x 83
  ContinueNormal_<LANG>.png     340 x 94
  HerosNormal_<LANG>.png        165 x 77
  AchievementNormal_<LANG>.png  172 x 78

参考底图(英文原版,用作 ChatGPT 图像重绘的底):
  ../NewGameNormal.png  ../ContinueNormal.png  ../HerosNormal.png  ../AchievementNormal.png

例:简体中文「新游戏」按钮 -> NewGameNormal_CNS.png (318x83)
放好后刷新页面即可生效(无需改配置)。
