# dsh-split-view

DSH 对话 + 轨迹左右分栏插件(常驻静态客户端插件版)。

对话与轨迹视图左右并排显示,中间分隔条可自由拖动调整宽度,并记住你的布局偏好。

## 功能

- **左右分栏**:对话在左、轨迹在右,同步对照;
- **自由拖动**:分隔条可拖,轨迹栏 280px 起,对话栏保底 480px;
- **宽度记忆**:拖动宽度写入 `localStorage`,刷新页面、重启电脑后自动恢复;
- **关闭与重开**:面板右上角 × 关闭后,页面右缘出现竖排「轨迹」小标签,点一下立即重开;
- **状态记忆**:关闭状态同样被记住——你关了它,切换会话、刷新页面都保持关闭;重开后则一直跟随显示;
- **自动加载**:作为静态客户端插件随页面每次加载自动挂载,不需要运行卡片、不需要批准、不随进程重启丢失。

## 安装

以 DSH 的 web 配置为例(路径以你的部署为准,`<DSH_HOME>` 通常为 `~/.dsh`):

1. 把本仓库目录复制到配置的依赖目录:

   ```
   <DSH_HOME>/profiles/web/node_modules/@local/dsh-split-view
   ```

2. 编辑 `<DSH_HOME>/profiles/web/cordis.patch.yml`,在补丁数组中加入:

   ```yaml
   - insert:
       - id: ui-split-view
         name: '@local/dsh-split-view'
   ```

3. 重启 `dsh web`(或等待配置热加载),刷新浏览器页面即可,分栏自动出现。

## 卸载

删除上述依赖目录,并移除 `cordis.patch.yml` 中对应的 `insert` 条目。

## 文件说明

| 文件 | 作用 |
| --- | --- |
| `client.js` | 浏览器端插件本体(模块加载器格式,含全部 UI 与交互逻辑) |
| `index.js` | Node 端空实现(该插件没有宿主侧行为) |
| `package.json` | 包声明,含 `dsh.client` 平台标记与 `./client` 导出 |

## 说明

- 宽度与关闭状态分别存储在 `localStorage` 的 `dsh.split-view.detailsWidth` 与 `dsh.split-view.closedByUser` 中;
- 插件以 `priority: -10` 注册,遮蔽内置详情面板并接管右栏宽度;
- 若改包名,需同步修改 `cordis.patch.yml` 中的 `name` 与 `package.json` 的 `name`。
