window.__ModuleLoader__.load({
  id: "@local/dsh-split-view",
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" })
    const React = require("react")

    const CSS = [
      '.dsp-panel{display:flex;flex-direction:column;height:100%;min-width:0;background:var(--dsw-alias-bg-base)}',
      '.dsp-header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:14px 12px 12px;border-bottom:1px solid var(--dsw-alias-border-l2);flex:none}',
      '.dsp-title{color:var(--dsw-alias-label-primary);text-overflow:ellipsis;white-space:nowrap;font-size:14px;font-weight:500;line-height:20px;overflow:hidden}',
      '.dsp-close{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:transparent;border:none;border-radius:999px;flex:none;display:grid;place-items:center}',
      '.dsp-close:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.dsp-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}',
      '.dsp-hint{color:var(--dsw-alias-label-tertiary);padding:12px 16px;font-size:13px;line-height:20px}',
      '.dsp-error{color:var(--dsw-alias-state-error-primary);padding:12px 16px;font-size:13px;line-height:20px;white-space:pre-wrap}',
      '[data-slot="root"] > div{grid-template-columns:var(--dsp-sidebar-track,280px) minmax(0,1fr) var(--dsp-details-track,0px)!important}',
      '[data-side="details"]{display:none!important}',
      '.dsp-handle{position:absolute;top:0;bottom:0;width:8px;margin-left:-4px;cursor:col-resize;touch-action:none;pointer-events:auto;z-index:2}',
      '.dsp-handle::after{content:"";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:12px;height:32px;border-radius:10px;background:var(--dsw-alias-button-floating-fill);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);opacity:0;transition:opacity var(--ds-transition-duration-slow) var(--ds-ease-in-out)}',
      '.dsp-handle:hover::after,.dsp-handle[data-dragging="true"]::after{opacity:1}',
      '.dsp-handle[data-dragging="true"]::after{background:var(--dsw-alias-button-floating-hover);border-color:var(--dsw-alias-border-l3)}',
      '.dsp-reopen{position:absolute;top:50%;right:0;transform:translateY(-50%);padding:10px 5px;background:var(--dsw-alias-button-floating-fill);border:1px solid var(--dsw-alias-border-l2);border-right:none;border-radius:10px 0 0 10px;color:var(--dsw-alias-label-secondary);cursor:pointer;pointer-events:auto;z-index:2;font-size:12px;line-height:1;letter-spacing:3px;writing-mode:vertical-rl}',
      '.dsp-reopen:hover{background:var(--dsw-alias-button-floating-hover);color:var(--dsw-alias-label-primary)}',
      'html.dsp-dragging [data-slot="root"] > div{transition:none!important}'
    ].join('\n')

    const DEFAULT_DETAILS_WIDTH = 360
    const MIN_DETAILS_WIDTH = 280
    const CENTER_FLOOR = 480
    const STORAGE_KEY = 'dsh.split-view.detailsWidth'
    const CLOSED_KEY = 'dsh.split-view.closedByUser'

    const readStoredWidth = () => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw === null) return 0
        const value = Number(raw)
        return Number.isFinite(value) && value >= MIN_DETAILS_WIDTH ? Math.round(value) : 0
      } catch (error) {
        return 0
      }
    }

    let closedByUser = false
    try {
      closedByUser = window.localStorage.getItem(CLOSED_KEY) === '1'
    } catch (error) {}

    exports.inject = ['slots', 'layout']
    exports.apply = (ctx) => {
      const slots = ctx.slots
      const layout = ctx.layout

      const style = document.createElement('style')
      style.setAttribute('data-dsh', 'split-view')
      style.textContent = CSS
      document.head.appendChild(style)
      ctx.effect(() => () => {
        style.remove()
      }, 'split-view: remove injected styles')

      ctx.effect(() => () => {
        try {
          layout.closeDetails()
        } catch (error) {
          console.error('[split-view] failed to close details on unload:', error)
        }
      }, 'split-view: restore closed details panel on unload')

      const DEFAULT_PANELS = { sidebar: 280, details: 0, narrow: false, narrowExpanded: false }
      const defaultPanelsSource = { getSnapshot: () => DEFAULT_PANELS, subscribe: () => () => {} }

      const useSlotVersion = (key) => {
        const [version, setVersion] = React.useState(() => slots.getVersion(key))
        React.useEffect(() => {
          const check = () => setVersion(slots.getVersion(key))
          const current = slots.getVersion(key)
          if (current !== slots.getVersion(key)) check()
          return slots.subscribe(key, check)
        }, [key])
        return version
      }

      const useSourceSelector = (source, selector) => {
        const [state, setState] = React.useState(() => selector(source.getSnapshot()))
        const stateRef = React.useRef(state)
        const selRef = React.useRef(selector)
        selRef.current = selector
        React.useEffect(() => {
          const src = source
          const check = () => {
            const next = selRef.current(src.getSnapshot())
            if (!Object.is(next, stateRef.current)) {
              stateRef.current = next
              setState(next)
            }
          }
          const current = selRef.current(src.getSnapshot())
          if (!Object.is(current, stateRef.current)) {
            stateRef.current = current
            setState(current)
          }
          return src.subscribe(check)
        }, [source])
        return state
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
          console.error('[split-view] trajectory panel crashed:', error)
        }
        render() {
          if (this.state.error !== null) {
            const message = this.state.error instanceof Error ? this.state.error.message : String(this.state.error)
            return React.createElement('div', { className: 'dsp-error' }, '轨迹面板渲染失败: ' + message)
          }
          return this.props.children
        }
      }

      // conversation.view is owned by conversation.session in the current SlotMap.
      // A details entry cannot declare it a second time, so keep this adapter
      // isolated to the trajectory entry and forward the current standard props.
      function SplitDetailsPanel(props) {
        const sessionId = props.sessionId
        useSlotVersion('conversation.view')

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

        React.useEffect(() => {
          if (!closedByUser) layout.openDetails()
        }, [sessionId])

        let body
        if (Comp === undefined) {
          body = React.createElement('div', { className: 'dsp-hint' }, '轨迹视图未加载 (ui-trajectory 未安装)')
        } else {
          const noop = () => {}
          const loadOlder = injected?.loadOlder ?? (async () => false)
          const loadImage = injected?.loadImage ?? (() => null)
          const setActualDuration = injected?.setActualDuration ?? noop
          const renderSlot = typeof props.renderSlot === 'function' ? props.renderSlot : () => null
          const title = typeof props.t === 'function' ? props.t('view.trajectory') : '轨迹'
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
            onInspectDone: noop,
            title
          }))
        }

        return React.createElement('div', { className: 'dsp-panel' },
          React.createElement('div', { className: 'dsp-header' },
            React.createElement('div', { className: 'dsp-title' }, typeof props.t === 'function' ? props.t('view.trajectory') : '轨迹'),
            React.createElement('button', {
              type: 'button',
              className: 'dsp-close',
              'aria-label': '关闭轨迹面板',
              title: '关闭轨迹面板',
              onClick: () => {
                closedByUser = true
                try {
                  window.localStorage.setItem(CLOSED_KEY, '1')
                } catch (error) {}
                layout.closeDetails()
              }
            }, React.createElement('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': true },
              React.createElement('path', { d: 'M4 4l8 8M12 4l-8 8', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' })))
          ),
          React.createElement('div', { className: 'dsp-body' }, body)
        )
      }

      function WidthController(props) {
        const useSessions = props.useSessions
        const sessionInfo = useSessions((s) => {
          const current = s.current
          const entry = current !== undefined ? s.byId[current] : undefined
          return { current: current ?? null, blank: entry === undefined ? null : entry.blank === true }
        })
        const hasSession = sessionInfo.current !== null && sessionInfo.blank === false

        useSlotVersion('root')
        const rootEntry = slots.entries('root').find((e) => e.store !== undefined)
        const layoutStore = React.useMemo(() => {
          if (rootEntry === undefined) return undefined
          try {
            return slots.resolveStore(rootEntry.store, undefined)
          } catch (error) {
            console.error('[split-view] layout store unavailable:', error)
            return undefined
          }
        }, [rootEntry])
        const panelsSource = layoutStore !== undefined ? layoutStore : defaultPanelsSource
        const panels = useSourceSelector(panelsSource, (s) => s)

        const [viewport, setViewport] = React.useState(() => window.innerWidth)
        const [w, setW] = React.useState(0)
        const [dragging, setDragging] = React.useState(false)
        const wRef = React.useRef(0)
        const lastWRef = React.useRef(readStoredWidth())
        const dragRef = React.useRef(null)

        React.useEffect(() => {
          const onResize = () => setViewport(window.innerWidth)
          window.addEventListener('resize', onResize)
          return () => window.removeEventListener('resize', onResize)
        }, [])

        const narrow = viewport < 1024
        const sidebarCollapsed = narrow ? !panels.narrowExpanded : panels.sidebar === 0
        const sidebarRaw = sidebarCollapsed ? 0 : (panels.sidebar === 0 ? 280 : panels.sidebar)
        const sidebarTrack = sidebarRaw === 0 ? 56 : Math.min(420, Math.max(264, Math.round(sidebarRaw)))
        const maxW = Math.max(MIN_DETAILS_WIDTH, viewport - sidebarTrack - CENTER_FLOOR)

        React.useEffect(() => {
          if (panels.details === 0 || !hasSession) {
            if (wRef.current !== 0) {
              wRef.current = 0
              setW(0)
            }
          } else if (wRef.current === 0) {
            const stored = lastWRef.current > 0 ? lastWRef.current : DEFAULT_DETAILS_WIDTH
            const next = Math.min(maxW, stored)
            wRef.current = next
            lastWRef.current = next
            setW(next)
          }
        }, [panels.details, hasSession, maxW])

        React.useEffect(() => {
          if (wRef.current > maxW) {
            wRef.current = maxW
            lastWRef.current = maxW
            setW(maxW)
          }
        }, [maxW])

        React.useEffect(() => {
          const root = document.documentElement
          root.style.setProperty('--dsp-sidebar-track', sidebarTrack + 'px')
          root.style.setProperty('--dsp-details-track', w + 'px')
          return () => {
            root.style.removeProperty('--dsp-sidebar-track')
            root.style.removeProperty('--dsp-details-track')
          }
        }, [sidebarTrack, w])

        React.useEffect(() => {
          const root = document.documentElement
          if (dragging) root.classList.add('dsp-dragging')
          return () => root.classList.remove('dsp-dragging')
        }, [dragging])

        if (w <= 0) {
          if (!hasSession) return null
          return React.createElement('div', {
            className: 'dsp-reopen',
            title: '重新打开轨迹分栏',
            'aria-label': '重新打开轨迹分栏',
            onClick: () => {
              closedByUser = false
              try {
                window.localStorage.removeItem(CLOSED_KEY)
              } catch (error) {}
              layout.openDetails()
            }
          }, '轨迹')
        }

        return React.createElement('div', {
          className: 'dsp-handle',
          style: { left: viewport - w },
          'data-dragging': dragging || undefined,
          onPointerDown: (e) => {
            e.preventDefault()
            e.currentTarget.setPointerCapture(e.pointerId)
            dragRef.current = { startX: e.clientX, startW: wRef.current, id: e.pointerId }
            setDragging(true)
          },
          onPointerMove: (e) => {
            const d = dragRef.current
            if (d === null || !e.currentTarget.hasPointerCapture(e.pointerId)) return
            const next = Math.min(maxW, Math.max(MIN_DETAILS_WIDTH, d.startW - (e.clientX - d.startX)))
            if (next !== wRef.current) {
              wRef.current = next
              lastWRef.current = next
              setW(next)
            }
          },
          onPointerUp: (e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
            e.currentTarget.releasePointerCapture(e.pointerId)
            dragRef.current = null
            setDragging(false)
            try {
              window.localStorage.setItem(STORAGE_KEY, String(wRef.current))
            } catch (error) {}
          }
        })
      }

      slots.inject('details', () => slots.register({
        name: 'details',
        priority: -10,
        locale: 'trajectory'
      }, SplitDetailsPanel))
      slots.inject('shell.overlay', () => slots.register({ name: 'shell.overlay', id: 'dsp-resize-handle', priority: -10 }, WidthController))
    }

    return module.exports
  }
})
