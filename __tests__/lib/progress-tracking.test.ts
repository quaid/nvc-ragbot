/**
 * Progress Tracking Tests
 *
 * Tests the optional NVC practice progress tracking functionality:
 * - Progress data structure and storage
 * - Tracking scenario completions
 * - Tracking practice attempts and ratings
 * - Progress statistics and streaks
 * - Privacy controls (opt-in/opt-out)
 *
 * TDD: RED phase - these tests should FAIL initially
 */

import {
  ProgressTracker,
  PracticeAttempt,
  ProgressStats,
  ProgressData,
  createProgressTracker,
  DEFAULT_PROGRESS_DATA
} from '@/lib/progress-tracking'

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('Progress Data Structure', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('PracticeAttempt interface', () => {
    it('should have required fields for tracking an attempt', () => {
      const attempt: PracticeAttempt = {
        id: 'attempt-123',
        scenarioId: 'scenario-456',
        timestamp: Date.now(),
        mode: 'practice',
        focusComponent: 'feelings',
        difficulty: 'beginner',
        rating: 4,
        completed: true
      }

      expect(attempt).toHaveProperty('id')
      expect(attempt).toHaveProperty('scenarioId')
      expect(attempt).toHaveProperty('timestamp')
      expect(attempt).toHaveProperty('mode')
      expect(attempt).toHaveProperty('completed')
    })

    it('should allow optional fields', () => {
      const minimalAttempt: PracticeAttempt = {
        id: 'attempt-123',
        scenarioId: 'scenario-456',
        timestamp: Date.now(),
        mode: 'translate',
        completed: false
      }

      expect(minimalAttempt.rating).toBeUndefined()
      expect(minimalAttempt.focusComponent).toBeUndefined()
      expect(minimalAttempt.difficulty).toBeUndefined()
    })
  })

  describe('ProgressData interface', () => {
    it('should have default structure', () => {
      expect(DEFAULT_PROGRESS_DATA).toEqual({
        enabled: false,
        attempts: [],
        completedScenarios: [],
        streakDays: 0,
        lastPracticeDate: null,
        totalPracticeTime: 0
      })
    })
  })
})

describe('ProgressTracker', () => {
  let tracker: ProgressTracker

  beforeEach(() => {
    localStorage.clear()
    tracker = createProgressTracker()
  })

  describe('initialization', () => {
    it('creates tracker with default disabled state', () => {
      expect(tracker.isEnabled()).toBe(false)
    })

    it('loads existing progress from localStorage', () => {
      const existingData: ProgressData = {
        enabled: true,
        attempts: [],
        completedScenarios: ['scenario-1'],
        streakDays: 5,
        lastPracticeDate: '2026-01-28',
        totalPracticeTime: 3600
      }
      localStorage.setItem('nvc_progress', JSON.stringify(existingData))

      const newTracker = createProgressTracker()
      expect(newTracker.isEnabled()).toBe(true)
      expect(newTracker.getCompletedScenarios()).toContain('scenario-1')
    })
  })

  describe('enable/disable tracking', () => {
    it('enables tracking when user opts in', () => {
      tracker.enable()
      expect(tracker.isEnabled()).toBe(true)
    })

    it('disables tracking when user opts out', () => {
      tracker.enable()
      tracker.disable()
      expect(tracker.isEnabled()).toBe(false)
    })

    it('clears all data when disabled with clearData option', () => {
      tracker.enable()
      tracker.recordAttempt({
        scenarioId: 'test-scenario',
        mode: 'practice',
        completed: true
      })

      tracker.disable({ clearData: true })

      expect(tracker.getAttempts()).toHaveLength(0)
      expect(tracker.getCompletedScenarios()).toHaveLength(0)
    })

    it('preserves data when disabled without clearData option', () => {
      tracker.enable()
      tracker.recordAttempt({
        scenarioId: 'test-scenario',
        mode: 'practice',
        completed: true
      })

      tracker.disable()

      // Data preserved but tracking disabled
      tracker.enable()
      expect(tracker.getAttempts()).toHaveLength(1)
    })
  })

  describe('recording attempts', () => {
    beforeEach(() => {
      tracker.enable()
    })

    it('records a practice attempt', () => {
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'practice',
        completed: true,
        rating: 4
      })

      const attempts = tracker.getAttempts()
      expect(attempts).toHaveLength(1)
      expect(attempts[0].scenarioId).toBe('scenario-123')
      expect(attempts[0].completed).toBe(true)
    })

    it('auto-generates id and timestamp', () => {
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'translate',
        completed: false
      })

      const attempts = tracker.getAttempts()
      expect(attempts[0].id).toBeDefined()
      expect(attempts[0].timestamp).toBeDefined()
      expect(typeof attempts[0].timestamp).toBe('number')
    })

    it('adds completed scenarios to completedScenarios list', () => {
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'practice',
        completed: true
      })

      expect(tracker.getCompletedScenarios()).toContain('scenario-123')
    })

    it('does not add incomplete scenarios to completedScenarios', () => {
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'practice',
        completed: false
      })

      expect(tracker.getCompletedScenarios()).not.toContain('scenario-123')
    })

    it('does not record when tracking is disabled', () => {
      tracker.disable()
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'practice',
        completed: true
      })

      tracker.enable()
      expect(tracker.getAttempts()).toHaveLength(0)
    })

    it('persists attempts to localStorage', () => {
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'practice',
        completed: true
      })

      const stored = JSON.parse(localStorage.getItem('nvc_progress') || '{}')
      expect(stored.attempts).toHaveLength(1)
    })
  })

  describe('streak tracking', () => {
    beforeEach(() => {
      tracker.enable()
    })

    it('starts streak at 0', () => {
      expect(tracker.getStreak()).toBe(0)
    })

    it('increments streak on first practice', () => {
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'practice',
        completed: true
      })

      expect(tracker.getStreak()).toBe(1)
    })

    it('maintains streak for consecutive days', () => {
      // Simulate yesterday's practice
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const existingData: ProgressData = {
        enabled: true,
        attempts: [{
          id: 'old-attempt',
          scenarioId: 'old-scenario',
          timestamp: yesterday.getTime(),
          mode: 'practice',
          completed: true
        }],
        completedScenarios: ['old-scenario'],
        streakDays: 1,
        lastPracticeDate: yesterday.toISOString().split('T')[0],
        totalPracticeTime: 0
      }
      localStorage.setItem('nvc_progress', JSON.stringify(existingData))

      const newTracker = createProgressTracker()
      newTracker.recordAttempt({
        scenarioId: 'today-scenario',
        mode: 'practice',
        completed: true
      })

      expect(newTracker.getStreak()).toBe(2)
    })

    it('resets streak after missing a day', () => {
      // Simulate practice from 3 days ago
      const threeDaysAgo = new Date()
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

      const existingData: ProgressData = {
        enabled: true,
        attempts: [],
        completedScenarios: [],
        streakDays: 5,
        lastPracticeDate: threeDaysAgo.toISOString().split('T')[0],
        totalPracticeTime: 0
      }
      localStorage.setItem('nvc_progress', JSON.stringify(existingData))

      const newTracker = createProgressTracker()
      newTracker.recordAttempt({
        scenarioId: 'new-scenario',
        mode: 'practice',
        completed: true
      })

      expect(newTracker.getStreak()).toBe(1)
    })
  })

  describe('statistics', () => {
    beforeEach(() => {
      tracker.enable()
    })

    it('calculates total attempts', () => {
      tracker.recordAttempt({ scenarioId: 's1', mode: 'practice', completed: true })
      tracker.recordAttempt({ scenarioId: 's2', mode: 'translate', completed: false })
      tracker.recordAttempt({ scenarioId: 's3', mode: 'practice', completed: true })

      const stats = tracker.getStats()
      expect(stats.totalAttempts).toBe(3)
    })

    it('calculates completion rate', () => {
      tracker.recordAttempt({ scenarioId: 's1', mode: 'practice', completed: true })
      tracker.recordAttempt({ scenarioId: 's2', mode: 'translate', completed: false })
      tracker.recordAttempt({ scenarioId: 's3', mode: 'practice', completed: true })
      tracker.recordAttempt({ scenarioId: 's4', mode: 'practice', completed: true })

      const stats = tracker.getStats()
      expect(stats.completionRate).toBe(75) // 3 out of 4
    })

    it('calculates average rating', () => {
      tracker.recordAttempt({ scenarioId: 's1', mode: 'practice', completed: true, rating: 4 })
      tracker.recordAttempt({ scenarioId: 's2', mode: 'practice', completed: true, rating: 5 })
      tracker.recordAttempt({ scenarioId: 's3', mode: 'practice', completed: true, rating: 3 })

      const stats = tracker.getStats()
      expect(stats.averageRating).toBe(4)
    })

    it('counts attempts by focus component', () => {
      tracker.recordAttempt({ scenarioId: 's1', mode: 'practice', completed: true, focusComponent: 'feelings' })
      tracker.recordAttempt({ scenarioId: 's2', mode: 'practice', completed: true, focusComponent: 'feelings' })
      tracker.recordAttempt({ scenarioId: 's3', mode: 'practice', completed: true, focusComponent: 'needs' })

      const stats = tracker.getStats()
      expect(stats.byComponent.feelings).toBe(2)
      expect(stats.byComponent.needs).toBe(1)
    })

    it('counts attempts by difficulty', () => {
      tracker.recordAttempt({ scenarioId: 's1', mode: 'practice', completed: true, difficulty: 'beginner' })
      tracker.recordAttempt({ scenarioId: 's2', mode: 'practice', completed: true, difficulty: 'beginner' })
      tracker.recordAttempt({ scenarioId: 's3', mode: 'practice', completed: true, difficulty: 'advanced' })

      const stats = tracker.getStats()
      expect(stats.byDifficulty.beginner).toBe(2)
      expect(stats.byDifficulty.advanced).toBe(1)
    })

    it('returns empty stats when no attempts', () => {
      const stats = tracker.getStats()
      expect(stats.totalAttempts).toBe(0)
      expect(stats.completionRate).toBe(0)
      expect(stats.averageRating).toBe(0)
    })
  })

  describe('scenario completion status', () => {
    beforeEach(() => {
      tracker.enable()
    })

    it('checks if scenario is completed', () => {
      tracker.recordAttempt({
        scenarioId: 'scenario-123',
        mode: 'practice',
        completed: true
      })

      expect(tracker.isScenarioCompleted('scenario-123')).toBe(true)
      expect(tracker.isScenarioCompleted('scenario-456')).toBe(false)
    })

    it('returns all attempts for a specific scenario', () => {
      tracker.recordAttempt({ scenarioId: 'scenario-123', mode: 'practice', completed: false })
      tracker.recordAttempt({ scenarioId: 'scenario-456', mode: 'practice', completed: true })
      tracker.recordAttempt({ scenarioId: 'scenario-123', mode: 'practice', completed: true })

      const attempts = tracker.getAttemptsForScenario('scenario-123')
      expect(attempts).toHaveLength(2)
      expect(attempts.every(a => a.scenarioId === 'scenario-123')).toBe(true)
    })
  })

  describe('data export/import', () => {
    beforeEach(() => {
      tracker.enable()
    })

    it('exports progress data as JSON', () => {
      tracker.recordAttempt({ scenarioId: 's1', mode: 'practice', completed: true })

      const exported = tracker.exportData()
      const parsed = JSON.parse(exported)

      expect(parsed.attempts).toHaveLength(1)
      expect(parsed.enabled).toBe(true)
    })

    it('imports progress data from JSON', () => {
      const importData: ProgressData = {
        enabled: true,
        attempts: [{
          id: 'imported-1',
          scenarioId: 'imported-scenario',
          timestamp: Date.now(),
          mode: 'practice',
          completed: true
        }],
        completedScenarios: ['imported-scenario'],
        streakDays: 10,
        lastPracticeDate: '2026-01-28',
        totalPracticeTime: 7200
      }

      tracker.importData(JSON.stringify(importData))

      expect(tracker.getAttempts()).toHaveLength(1)
      expect(tracker.getStreak()).toBe(10)
      expect(tracker.getCompletedScenarios()).toContain('imported-scenario')
    })
  })
})

describe('ProgressStats Interface', () => {
  it('should have correct structure', () => {
    const stats: ProgressStats = {
      totalAttempts: 10,
      completedAttempts: 8,
      completionRate: 80,
      averageRating: 4.2,
      streakDays: 5,
      byComponent: {
        observations: 2,
        feelings: 3,
        needs: 2,
        requests: 1
      },
      byDifficulty: {
        beginner: 4,
        intermediate: 3,
        advanced: 1
      },
      byMode: {
        practice: 6,
        translate: 2
      }
    }

    expect(stats).toHaveProperty('totalAttempts')
    expect(stats).toHaveProperty('completionRate')
    expect(stats).toHaveProperty('averageRating')
    expect(stats).toHaveProperty('streakDays')
    expect(stats).toHaveProperty('byComponent')
    expect(stats).toHaveProperty('byDifficulty')
    expect(stats).toHaveProperty('byMode')
  })
})
