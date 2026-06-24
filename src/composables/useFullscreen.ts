import { ref, onMounted, onUnmounted } from 'vue'

function getFullscreenElement() {
  return (
    document.fullscreenElement ??
    (document as Document & { webkitFullscreenElement?: Element })
      .webkitFullscreenElement ??
    null
  )
}

export function useFullscreen() {
  const isFullscreen = ref(false)
  const supported = ref(false)

  function update() {
    isFullscreen.value = !!getFullscreenElement()
  }

  async function toggle() {
    if (!supported.value) return

    try {
      if (getFullscreenElement()) {
        if (document.exitFullscreen) await document.exitFullscreen()
        else
          await (
            document as Document & { webkitExitFullscreen?: () => Promise<void> }
          ).webkitExitFullscreen?.()
      } else {
        const el = document.documentElement
        if (el.requestFullscreen) await el.requestFullscreen()
        else
          await (
            el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
          ).webkitRequestFullscreen?.()
      }
    } catch {
      /* ignore unsupported or denied */
    }
  }

  onMounted(() => {
    const el = document.documentElement
    supported.value = !!(
      el.requestFullscreen ||
      (el as HTMLElement & { webkitRequestFullscreen?: () => void })
        .webkitRequestFullscreen
    )
    document.addEventListener('fullscreenchange', update)
    document.addEventListener('webkitfullscreenchange', update)
    update()
  })

  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', update)
    document.removeEventListener('webkitfullscreenchange', update)
  })

  return { isFullscreen, supported, toggle }
}
