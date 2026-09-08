# dsh-split-view

DSH 对话 + 轨迹左右分栏插件(常驻静态客户端插件版)。

对话在中间,轨迹作为一个新增标签页显示在 DSH 自带的右侧栏中,不替换或删除右侧栏原有功能。

## 功能

- **右栏内新增标签**:通过 DSH 的 `sidebar.right.pane.tab` 注册「轨迹」,保留原有「开始」等右栏标签;
- **沿用原生拖动**:右栏宽度、分隔条、全屏和收起行为全部交给 DSH `0.1.5-alpha.1` 原生实现;
- **自动打开**:切换到有内容的会话时自动打开轨迹标签,不会覆盖右栏宿主;
- **关闭与重开**:轨迹面板内的 × 只收起右栏,通过 DSH 原生「展开侧栏」重新打开;
- **状态记忆**:主动收起后切换会话不会自动抢回,手动展开右栏后恢复自动跟随;
- **自动加载**:作为静态客户端插件随页面每次加载自动挂载,不需要运行卡片、不需要批准、不随进程重启丢失;
- **版本适配**:面向 DSH `0.1.5-alpha.1` 的右栏标签 API,轨迹内容转发当前 `useSession`、`useTrajectory` 等标准会话 Hook。

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

- 插件只在 `localStorage` 保存主动收起状态 `dsh.split-view.closedByUser`;右栏宽度由 DSH 原生布局管理;
- 插件注册自己的右栏标签类型和标签内容,不注册 `rightbar` 宿主,不会替换原有右栏;
- 当前 DSH 的 `conversation.view` 由 `conversation.session` 独占声明,轨迹标签通过已注册的轨迹 View 适配当前组件参数,不触碰会话 Store 和 Host 私有面;
- 若改包名,需同步修改 `cordis.patch.yml` 中的 `name` 与 `package.json` 的 `name`。
