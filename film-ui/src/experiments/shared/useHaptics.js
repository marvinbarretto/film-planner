import { useState, useCallback } from 'react'

// Haptic feedback patterns using the Vibration API
export const hapticPatterns = {
  // Light tap - chip select
  light: () => navigator.vibrate?.(10),

  // Medium pulse - sheet open, major action
  medium: () => navigator.vibrate?.(20),

  // Double tap - chip deselect
  double: () => navigator.vibrate?.([10, 50, 10]),

  // Success/playful - Surprise Me button
  success: () => navigator.vibrate?.([10, 30, 10, 30, 20]),

  // Warning - clear all, destructive
  warning: () => navigator.vibrate?.(30),

  // Tick - subtle feedback for swipes
  tick: () => navigator.vibrate?.(5),
}

// Hook for managing haptic state and triggering haptics
export function useHaptics(defaultEnabled = true) {
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('experimentsHapticsEnabled')
      return stored !== null ? JSON.parse(stored) : defaultEnabled
    } catch {
      return defaultEnabled
    }
  })

  const toggleHaptics = useCallback(() => {
    setHapticsEnabled(prev => {
      const next = !prev
      try {
        localStorage.setItem('experimentsHapticsEnabled', JSON.stringify(next))
      } catch {
        // Ignore localStorage errors
      }
      return next
    })
  }, [])

  // Wrapped haptic functions that respect enabled state
  const haptics = {
    light: useCallback(() => {
      if (hapticsEnabled) hapticPatterns.light()
    }, [hapticsEnabled]),

    medium: useCallback(() => {
      if (hapticsEnabled) hapticPatterns.medium()
    }, [hapticsEnabled]),

    double: useCallback(() => {
      if (hapticsEnabled) hapticPatterns.double()
    }, [hapticsEnabled]),

    success: useCallback(() => {
      if (hapticsEnabled) hapticPatterns.success()
    }, [hapticsEnabled]),

    warning: useCallback(() => {
      if (hapticsEnabled) hapticPatterns.warning()
    }, [hapticsEnabled]),

    tick: useCallback(() => {
      if (hapticsEnabled) hapticPatterns.tick()
    }, [hapticsEnabled]),
  }

  // Check if vibration API is supported
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator

  return {
    haptics,
    hapticsEnabled,
    toggleHaptics,
    isSupported,
  }
}

export default useHaptics
