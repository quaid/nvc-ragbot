/**
 * useProgress Hook
 *
 * React hook for accessing the progress tracking functionality.
 * Provides reactive state updates when progress changes.
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  createProgressTracker,
  ProgressTracker,
  ProgressStats,
  PracticeAttempt,
  RecordAttemptInput
} from '@/lib/progress-tracking'

interface UseProgressReturn {
  // State
  isEnabled: boolean
  stats: ProgressStats
  attempts: PracticeAttempt[]
  completedScenarios: string[]
  streak: number

  // Actions
  enable: () => void
  disable: (clearData?: boolean) => void
  recordAttempt: (input: RecordAttemptInput) => void
  isScenarioCompleted: (scenarioId: string) => boolean
  getAttemptsForScenario: (scenarioId: string) => PracticeAttempt[]
  exportData: () => string
  importData: (json: string) => void
}

export function useProgress(): UseProgressReturn {
  const [tracker] = useState<ProgressTracker>(() => createProgressTracker())
  const [isEnabled, setIsEnabled] = useState(false)
  const [updateTrigger, setUpdateTrigger] = useState(0)

  // Initialize state from tracker
  useEffect(() => {
    setIsEnabled(tracker.isEnabled())
  }, [tracker])

  // Force re-render to get fresh data
  const refresh = useCallback(() => {
    setUpdateTrigger(prev => prev + 1)
  }, [])

  const enable = useCallback(() => {
    tracker.enable()
    setIsEnabled(true)
    refresh()
  }, [tracker, refresh])

  const disable = useCallback((clearData = false) => {
    tracker.disable({ clearData })
    setIsEnabled(false)
    refresh()
  }, [tracker, refresh])

  const recordAttempt = useCallback((input: RecordAttemptInput) => {
    tracker.recordAttempt(input)
    refresh()
  }, [tracker, refresh])

  const isScenarioCompleted = useCallback((scenarioId: string) => {
    return tracker.isScenarioCompleted(scenarioId)
  }, [tracker])

  const getAttemptsForScenario = useCallback((scenarioId: string) => {
    return tracker.getAttemptsForScenario(scenarioId)
  }, [tracker])

  const exportData = useCallback(() => {
    return tracker.exportData()
  }, [tracker])

  const importData = useCallback((json: string) => {
    tracker.importData(json)
    setIsEnabled(tracker.isEnabled())
    refresh()
  }, [tracker, refresh])

  // Memoize computed values
  const stats = useMemo(() => tracker.getStats(), [tracker, updateTrigger])
  const attempts = useMemo(() => tracker.getAttempts(), [tracker, updateTrigger])
  const completedScenarios = useMemo(() => tracker.getCompletedScenarios(), [tracker, updateTrigger])
  const streak = useMemo(() => tracker.getStreak(), [tracker, updateTrigger])

  return {
    isEnabled,
    stats,
    attempts,
    completedScenarios,
    streak,
    enable,
    disable,
    recordAttempt,
    isScenarioCompleted,
    getAttemptsForScenario,
    exportData,
    importData
  }
}
