window.__ModuleLoader__.load({
  id: "@local/dsh-split-view",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    const React = require("react")

    const CSS = [
      '.dsp-panel{display:flex;flex-direction:column;height:100%;min-width:0;background:var(--dsw-alias-bg-base)}',
      '.dsp-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px;border-bottom:1px solid var(--dsw-alias-border-l2);flex:none}',
      '.dsp-title{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}',
      '.dsp-close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:transparent;border:none;border-radius:999px;flex:none;display:grid;place-items:center}',
      '.dsp-close:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsp-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}',
      '.dsp-hint{color:var(--dsw-alias-label-tertiary);padding:12px 16px;font-size:13px;line-height:20px}',
      '.dsp-error{color:var(--dsw-alias-state-error-primary);padding:12px 16px;font-size:13px;line-height:20px;white-space:pre-wrap}'
    ].join('\n')

    const CLOSED_KEY = 'dsh.split-view.closedByUser'
    const TRAJECTORY_TAB_ID = '@local/dsh-split-view/trajectory'
    const TRAJECTORY_KIND = 'dsh-split-view-trajectory'

    let closedByUser = false
    try {
      closedByUser = window.localStorage.getItem(CLOSED_KEY) === '1'
    } catch (error) {}

    const setClosedByUser = (value) => {
      closedByUser = value
      try {
        if (value) window.localStorage.setItem(CLOSED_KEY, '1')
        else window.localStorage.removeItem(CLOSED_KEY)
      } catch (error) {}
    }

    exports.inject = ['slots', 'sidebarRightTabs', 'sidebarRight']
    exports.apply = (ctx) => {
      const slots = ctx.slots
      const sidebarRightTabs = ctx.sidebarRightTabs
      const sidebarRight = ctx.sidebarRight

      const style = document.createElement('style')
      style.setAttribute('data-dsh', 'split-view')
      style.textContent = CSS
      document.head.appendChild(style)
      ctx.effect(() => () => {
        style.remove()
      }, 'split-view: remove injected styles')

      const useSlotVersion = (key) => {
        const [version, setVersion] = React.useState(() => slots.getVersion(key))
        React.useEffect(() => {
          const check = () => setVersion(slots.getVersion(key))
          return slots.subscribe(key, check)
        }, [key])
        return version
      }

      const absent = { getSnapshot: () => undefined, subscribe: () => () => {} }
      const hookCache = new WeakMap()
      const sourceHook = (source) => {
        let hook = hookCache.get(source)
        if (hook === undefined) {
          hook = (selector) => {
            const [state, setState] = React.useState(() => selector(source.getSnapshot()))
            const stateRef = React.useRef(state)
            const selRef = React.useRef(selector)
            selRef.current = selector
            React.useEffect(() => {
              const check = () => {
                const next = selRef.current(source.getSnapshot())
                if (!Object.is(next, stateRef.current)) {
                  stateRef.current = next
                  setState(next)
                }
              }
              const current = selRef.current(source.getSnapshot())
              if (!Object.is(current, stateRef.current)) {
                stateRef.current = current
                setState(current)
              }
              return source.subscribe(check)
            }, [])
            return state
          }
          hookCache.set(source, hook)
        }
        return hook
      }
      const absentHook = sourceHook(absent)

      class PanelErrorBoundary extends React.Component {
        constructor(props) {
          super(props)
          this.state = { error: null }
        }
        static getDerivedStateFromError(error) {
          return { error }
        }
        componentDidCatch(error) {
          console.error('[split-view] trajectory tab crashed:', error)
        }
        render() {
          if (this.state.error !== null) {
            const message = this.state.error instanceof Error ? this.state.error.message : String(this.state.error)
            return React.createElement('div', { className: 'dsp-error' }, '轨迹面板渲染失败: ' + message)
          }
          return this.props.children
        }
      }

      function TrajectoryTabBody(props) {
        const sessionId = props.sessionId
        useSlotVersion('conversation.view')

        const useTabInfo = props.useTabInfo ?? (() => undefined)
        const tabInfo = useTabInfo()
        const expanded = tabInfo === undefined ? null : tabInfo.sidebar.expanded
        const wasExpanded = React.useRef(false)
        React.useEffect(() => {
          if (expanded === true) {
            wasExpanded.current = true
            if (closedByUser) setClosedByUser(false)
          } else if (expanded === false && wasExpanded.current) {
            setClosedByUser(true)
          }
        }, [expanded])

        const trajectoryEntry = slots.entries('conversation.view').find((e) => e.options.id === 'trajectory')
        const injected = React.useMemo(() => {
          if (trajectoryEntry === undefined) return undefined
          try {
            return trajectoryEntry.inject(sessionId)
          } catch (error) {
            console.error('[split-view] trajectory adapter injection failed:', error)
            return undefined
          }
        }, [trajectoryEntry, sessionId])
        const durationSource = injected?.hooks?.duration ?? absent
        const useDuration = sourceHook(durationSource)
        const Comp = trajectoryEntry?.component

        let body
        if (Comp === undefined) {
          body = React.createElement('div', { className: 'dsp-hint' }, '轨迹视图未加载 (ui-trajectory 未安装)')
        } else {
          const noop = () => {}
          const loadOlder = injected?.loadOlder ?? (async () => false)
          const loadImage = injected?.loadImage ?? (() => null)
          const setActualDuration = injected?.setActualDuration ?? noop
          const renderSlot = typeof props.renderSlot === 'function' ? props.renderSlot : () => null
          body = React.createElement(PanelErrorBoundary, null, React.createElement(Comp, {
            ...props,
            useSession: props.useSession ?? absentHook,
            useTrajectory: props.useTrajectory ?? absentHook,
            useDuration,
            loadOlder,
            loadImage,
            setActualDuration,
            viewRequest: props.viewRequest ?? null,
            completeViewRequest: props.completeViewRequest ?? noop,
            renderSlot,
            t: typeof props.t === 'function' ? props.t : (key) => key,
            inspect: null,
            onInspectDone: noop
          }))
        }

        return React.createElement('div', { className: 'dsp-panel' },
          React.createElement('div', { className: 'dsp-header' },
            React.createElement('div', { className: 'dsp-title' }, typeof props.t === 'function' ? props.t('view.trajectory') : '轨迹'),
            React.createElement('button', {
              type: 'button',
              className: 'dsp-close',
              'aria-label': '关闭轨迹分栏',
              title: '关闭轨迹分栏',
              onClick: () => {
                setClosedByUser(true)
                try {
                  sidebarRight.toggleExpanded()
                } catch (error) {
                  console.error('[split-view] failed to collapse right sidebar:', error)
                }
              }
            }, React.createElement('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true },
              React.createElement('path', { d: 'M4 4l8 8M12 4l-8 8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' })))
          ),
          React.createElement('div', { className: 'dsp-body' }, body)
        )
      }

      function TrajectoryLauncher(props) {
        const sessionInfo = props.useSessions((s) => {
          const current = s.current
          const entry = current !== undefined ? s.byId[current] : undefined
          return { current: current ?? null, blank: entry === undefined ? null : entry.blank === true }
        })
        const hasSession = sessionInfo.current !== null && sessionInfo.blank === false

        React.useEffect(() => {
          if (!hasSession || closedByUser) return
          try {
            sidebarRight.openTab(TRAJECTORY_KIND, { revealIfOpened: true })
          } catch (error) {
            console.error('[split-view] failed to open trajectory tab:', error)
          }
        }, [sessionInfo.current, hasSession])
        return null
      }

      ctx.effect(() => sidebarRightTabs.register({
        id: TRAJECTORY_TAB_ID,
        kind: TRAJECTORY_KIND,
        priority: 'extension',
        title: () => '轨迹'
      }), 'split-view: register trajectory tab type')

      ctx.effect(() => slots.inject('sidebar.right.pane.tab', () => slots.register({
        name: 'sidebar.right.pane.tab',
        key: TRAJECTORY_TAB_ID,
        locale: 'trajectory'
      }, TrajectoryTabBody)), 'split-view: register trajectory tab body')

      ctx.effect(() => slots.inject('shell.overlay', () => slots.register({
        name: 'shell.overlay',
        id: 'dsp-trajectory-launcher',
        priority: -10
      }, TrajectoryLauncher)), 'split-view: register trajectory launcher')
    }

    return module.exports
  }
})
