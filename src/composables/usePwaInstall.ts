import { ref, computed, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOSDevice() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream
  )
}

export function usePwaInstall() {
  const canPromptInstall = ref(false)
  const isInstalled = ref(false)
  const isIOS = ref(false)
  const showIOSHint = ref(false)

  let deferredPrompt: BeforeInstallPromptEvent | null = null

  function updateInstalled() {
    isInstalled.value = isStandaloneMode()
    if (isInstalled.value) canPromptInstall.value = false
  }

  function onBeforeInstallPrompt(event: Event) {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    canPromptInstall.value = true
  }

  const showInstallButton = computed(() => {
    if (isInstalled.value) return false
    return canPromptInstall.value || isIOS.value
  })

  async function install() {
    if (isInstalled.value) return

    if (isIOS.value) {
      showIOSHint.value = true
      return
    }

    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      canPromptInstall.value = false
      updateInstalled()
    }
    deferredPrompt = null
  }

  function dismissIOSHint() {
    showIOSHint.value = false
  }

  onMounted(() => {
    isIOS.value = isIOSDevice()
    updateInstalled()

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', updateInstalled)
    window
      .matchMedia('(display-mode: standalone)')
      .addEventListener('change', updateInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', updateInstalled)
    window
      .matchMedia('(display-mode: standalone)')
      .removeEventListener('change', updateInstalled)
  })

  return {
    canPromptInstall,
    isInstalled,
    isIOS,
    showIOSHint,
    showInstallButton,
    install,
    dismissIOSHint,
  }
}
