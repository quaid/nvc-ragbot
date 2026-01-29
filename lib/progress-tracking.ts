/**
 * Progress Tracking Module
 *
 * Optional progress tracking for NVC practice sessions.
 * Stores data in localStorage with user consent.
 * Tracks attempts, completions, streaks, and statistics.
 */

import { NVCComponent, Difficulty, PracticeModeType } from './practice-mode'

const STORAGE_KEY = 'nvc_progress'

/**
 * A single practice attempt record
 */
export interface PracticeAttempt {
  id: string
  scenarioId: string
  timestamp: number
  mode: PracticeModeType
  focusComponent?: NVCComponent
  difficulty?: Difficulty
  rating?: number
  completed: boolean
}

/**
 * Input for recording a new attempt (id and timestamp auto-generated)
 */
export interface RecordAttemptInput {
  scenarioId: string
  mode: PracticeModeType
  completed: boolean
  focusComponent?: NVCComponent
  difficulty?: Difficulty
  rating?: number
}

/**
 * Complete progress data structure
 */
export interface ProgressData {
  enabled: boolean
  attempts: PracticeAttempt[]
  completedScenarios: string[]
  streakDays: number
  lastPracticeDate: string | null
  totalPracticeTime: number
}

/**
 * Statistics calculated from progress data
 */
export interface ProgressStats {
  totalAttempts: number
  completedAttempts: number
  completionRate: number
  averageRating: number
  streakDays: number
  byComponent: Record<string, number>
  byDifficulty: Record<string, number>
  byMode: Record<string, number>
}

/**
 * Options for disabling tracking
 */
export interface DisableOptions {
  clearData?: boolean
}

/**
 * Default progress data for new users
 */
export const DEFAULT_PROGRESS_DATA: ProgressData = {
  enabled: false,
  attempts: [],
  completedScenarios: [],
  streakDays: 0,
  lastPracticeDate: null,
  totalPracticeTime: 0
}

/**
 * Progress tracking interface
 */
export interface ProgressTracker {
  isEnabled(): boolean
  enable(): void
  disable(options?: DisableOptions): void
  recordAttempt(input: RecordAttemptInput): void
  getAttempts(): PracticeAttempt[]
  getCompletedScenarios(): string[]
  getStreak(): number
  getStats(): ProgressStats
  isScenarioCompleted(scenarioId: string): boolean
  getAttemptsForScenario(scenarioId: string): PracticeAttempt[]
  exportData(): string
  importData(json: string): void
}

/**
 * Generate a unique ID for attempts
 */
function generateId(): string {
  return `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Check if a date string is yesterday
 */
function isYesterday(dateStr: string): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return dateStr === yesterday.toISOString().split('T')[0]
}

/**
 * Check if a date string is today
 */
function isToday(dateStr: string): boolean {
  return dateStr === getToday()
}

/**
 * Create a progress tracker instance
 */
export function createProgressTracker(): ProgressTracker {
  let data: ProgressData = loadData()

  function loadData(): ProgressData {
    if (typeof localStorage === 'undefined') {
      return { ...DEFAULT_PROGRESS_DATA }
    }

    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { ...DEFAULT_PROGRESS_DATA }
    }

    try {
      return JSON.parse(stored) as ProgressData
    } catch {
      return { ...DEFAULT_PROGRESS_DATA }
    }
  }

  function saveData(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }

  function updateStreak(): void {
    const today = getToday()

    if (data.lastPracticeDate === null) {
      // First practice ever
      data.streakDays = 1
      data.lastPracticeDate = today
    } else if (isToday(data.lastPracticeDate)) {
      // Already practiced today, streak unchanged
    } else if (isYesterday(data.lastPracticeDate)) {
      // Practiced yesterday, increment streak
      data.streakDays += 1
      data.lastPracticeDate = today
    } else {
      // Missed days, reset streak
      data.streakDays = 1
      data.lastPracticeDate = today
    }
  }

  return {
    isEnabled(): boolean {
      return data.enabled
    },

    enable(): void {
      data.enabled = true
      saveData()
    },

    disable(options?: DisableOptions): void {
      data.enabled = false

      if (options?.clearData) {
        data = { ...DEFAULT_PROGRESS_DATA }
      }

      saveData()
    },

    recordAttempt(input: RecordAttemptInput): void {
      if (!data.enabled) {
        return
      }

      const attempt: PracticeAttempt = {
        id: generateId(),
        timestamp: Date.now(),
        scenarioId: input.scenarioId,
        mode: input.mode,
        completed: input.completed,
        focusComponent: input.focusComponent,
        difficulty: input.difficulty,
        rating: input.rating
      }

      data.attempts.push(attempt)

      if (input.completed && !data.completedScenarios.includes(input.scenarioId)) {
        data.completedScenarios.push(input.scenarioId)
      }

      updateStreak()
      saveData()
    },

    getAttempts(): PracticeAttempt[] {
      return [...data.attempts]
    },

    getCompletedScenarios(): string[] {
      return [...data.completedScenarios]
    },

    getStreak(): number {
      return data.streakDays
    },

    getStats(): ProgressStats {
      const attempts = data.attempts
      const completedAttempts = attempts.filter(a => a.completed).length
      const ratedAttempts = attempts.filter(a => a.rating !== undefined)

      const byComponent: Record<string, number> = {}
      const byDifficulty: Record<string, number> = {}
      const byMode: Record<string, number> = {}

      for (const attempt of attempts) {
        if (attempt.focusComponent) {
          byComponent[attempt.focusComponent] = (byComponent[attempt.focusComponent] || 0) + 1
        }
        if (attempt.difficulty) {
          byDifficulty[attempt.difficulty] = (byDifficulty[attempt.difficulty] || 0) + 1
        }
        byMode[attempt.mode] = (byMode[attempt.mode] || 0) + 1
      }

      return {
        totalAttempts: attempts.length,
        completedAttempts,
        completionRate: attempts.length > 0 ? Math.round((completedAttempts / attempts.length) * 100) : 0,
        averageRating: ratedAttempts.length > 0
          ? Math.round(ratedAttempts.reduce((sum, a) => sum + (a.rating || 0), 0) / ratedAttempts.length * 10) / 10
          : 0,
        streakDays: data.streakDays,
        byComponent,
        byDifficulty,
        byMode
      }
    },

    isScenarioCompleted(scenarioId: string): boolean {
      return data.completedScenarios.includes(scenarioId)
    },

    getAttemptsForScenario(scenarioId: string): PracticeAttempt[] {
      return data.attempts.filter(a => a.scenarioId === scenarioId)
    },

    exportData(): string {
      return JSON.stringify(data)
    },

    importData(json: string): void {
      try {
        const imported = JSON.parse(json) as ProgressData
        data = imported
        saveData()
      } catch {
        // Invalid JSON, ignore
      }
    }
  }
}
