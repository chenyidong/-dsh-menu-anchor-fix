// dsh-menu-anchor-fix client half.
//
// 现象：dsh-armory 的召唤菜单（技能/MCP/专家/本项目）用 position:fixed + 视口坐标
// 定位（其 client.js 的 measure()），但会话列被收窄（dsh-chat-width-customizer 的
// 「宽度·1280px」）后，列内某个带 transform 的祖先成了 fixed 的定位包含块 —— armory
// 写好的视口 left 被当成"列内坐标"，菜单整体右甩一个列偏移量。
//
// 修法：不改 armory 的 DOM，也不猜偏移量。菜单每次被写完 inline style 后，实测
// getBoundingClientRect 与"应以触发图标为中心、夹进视口"的目标之差，把差值补回
// inline left（只修水平，见 fixOnce 尾部说明）。包含块偏移是线性平移，一次收敛；
// 换宽度档后偏移变了，下一次写入重新实测。子菜单 .dsh-mcp-quick-sub 相对菜单
// absolute，跟着走。
window.__ModuleLoader__.load({
  id: 'dsh-menu-anchor-fix',
  factory: function () {
    var module = { exports: {} }

    var MENU = '.dsh-mcp-quick-menu'
    var TRIGGER = '.dsh-mcp-quick-trigger'

    function fixOnce(menu) {
      if (!menu || !menu.style.left || !menu.isConnected) return
      var trig = document.querySelector(TRIGGER)
      if (!trig) return
      var rect = menu.getBoundingClientRect()
      if (rect.width === 0) return
      var t = trig.getBoundingClientRect()
      var vw = window.innerWidth

      // 水平：复刻 armory 的目标（图标中心对齐 + 夹进视口），再量当前渲染位置。
      var wantLeft = Math.max(4, Math.min(t.left + t.width / 2 - rect.width / 2, vw - rect.width - 4))
      var dx = rect.left - wantLeft
      if (Math.abs(dx) > 1) {
        menu.style.left = (parseFloat(menu.style.left) - dx) + 'px'
        return // 写回触发 attribute 观察，再测一次；收敛后自然停
      }

      // 垂直方向不修：包含块偏移只来自会话列的水平左移（实测纵向偏移为 0），
      // 菜单高度由 armory 自己按 needsUp 定 top/bottom。曾试过同样补 vertical，
      // 结果 style.bottom 的数值空间（距包含块底边）与视口 rect 混算，每帧把菜单
      // 从鼠标底下挪走 → 触发 armory 的 onMouseLeave 180ms scheduleClose → 弹窗一闪即关。
    }

    function apply(ctx) {
      if (typeof document === 'undefined') return
      var root = document.body || document.documentElement
      var scheduled = false
      var current = null
      var styleMo = null

      function schedule() {
        if (scheduled) return
        scheduled = true
        requestAnimationFrame(function () {
          scheduled = false
          try { fixOnce(current) } catch (e) { /* 临时浮层：静默 */ }
        })
      }

      function attach(menu) {
        if (current === menu && styleMo) return
        detachStyle()
        current = menu
        styleMo = new MutationObserver(schedule)
        styleMo.observe(menu, { attributes: true, attributeFilter: ['style'] })
        schedule()
      }

      function detachStyle() {
        if (styleMo) { styleMo.disconnect(); styleMo = null }
        current = null
      }

      var treeMo = new MutationObserver(function () {
        var menu = document.querySelector(MENU)
        if (menu) attach(menu)
        else detachStyle()
      })
      treeMo.observe(root, { childList: true, subtree: true })

      var onResize = function () { if (current) schedule() }
      window.addEventListener('resize', onResize)

      var menuNow = document.querySelector(MENU)
      if (menuNow) attach(menuNow)

      if (ctx && typeof ctx.effect === 'function') {
        ctx.effect(function () {
          return function () {
            treeMo.disconnect(); detachStyle(); window.removeEventListener('resize', onResize)
          }
        }, 'dsh-menu-anchor-fix: menu re-anchor')
      }
    }

    module.exports = { name: 'menu-anchor-fix', inject: [], apply: apply }
    return module.exports
  },
})
