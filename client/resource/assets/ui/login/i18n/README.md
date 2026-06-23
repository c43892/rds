# 登录按钮 - 各语言成品图

游戏优先加载本目录下"当前语言"的按钮图;某语言缺图则回退为运行时生成的木质按钮。

目录结构:  i18n/<语言码>/<状态图>.png
语言码:CNS CNT JA KO ES FR DE PT RU  (EN 用原图,不放这里)

每种语言放下列图(尺寸需与原图一致,PNG 带透明):
  NewGameNormal.png / NewGameDown.png                         318x83
  ContinueNormal.png / ContinueDown.png / ContinueDisabled.png 340x94
  HerosNormal.png / HerosDown.png                             165x77
  AchievementNormal.png / AchievementDown.png / AchievementDisabled.png  172x78

加载规则:Normal 必需;Down/Disabled 有则用(按下态/禁用态),无则按下保持原样、禁用置灰。
参考底图(英文原版):上一级目录的 NewGameNormal.png 等。
放好刷新页面即生效,无需改配置。
