# dsh-menu-anchor-fix

修复 dsh-armory「召唤菜单」（技能 / MCP / 专家 / 本项目）在会话列被收窄时整体偏右的问题。

## 原因

armory 的菜单用 `position: fixed` + 视口坐标定位。当 `dsh-chat-width-customizer`
等插件把会话列收窄（如「宽度·1280px」）后，列内某个带 `transform` 的祖先容器成为
fixed 元素的定位包含块，armory 写入的视口坐标被按"列内坐标"渲染，菜单整体右甩一个
列偏移量（≈ 窗口宽 − 列宽）。

## 做法

不改 dsh-armory 本体、不搬 DOM：菜单出现后监听其 inline style 写入，实测
`getBoundingClientRect` 与目标位置（触发图标中心对齐、夹进视口）之差，把差值补回
`left / top / bottom`。偏移为线性平移，一次收敛；切换宽度档位后自动重测。

纯客户端插件（host fiber 为空壳），卸载即还原。
