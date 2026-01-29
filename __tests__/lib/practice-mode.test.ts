/**
 * Practice Mode Tests
 *
 * Tests the NVC practice mode functionality including:
 * - Mode detection from user messages
 * - Scenario filtering by difficulty and focus
 * - Single-response vs multi-turn mode handling
 *
 * TDD: GREEN phase - implementation in lib/practice-mode.ts
 */

import {
  detectPracticeMode,
  PracticeMode,
  filterScenarios,
  ScenarioFilter
} from '@/lib/practice-mode'

describe('Practice Mode Detection', () => {
  describe('detectPracticeMode', () => {
    describe('should detect practice mode keywords', () => {
      it('detects "practice" keyword', () => {
        const result = detectPracticeMode('I want to practice NVC')
        expect(result.isPracticeMode).toBe(true)
        expect(result.mode).toBe('practice')
      })

      it('detects "scenario" keyword', () => {
        const result = detectPracticeMode('Give me a scenario to work on')
        expect(result.isPracticeMode).toBe(true)
        expect(result.mode).toBe('practice')
      })

      it('detects "translate" keyword for translation practice', () => {
        const result = detectPracticeMode('Help me translate this into NVC')
        expect(result.isPracticeMode).toBe(true)
        expect(result.mode).toBe('translate')
      })

      it('detects "transform" keyword for translation practice', () => {
        const result = detectPracticeMode('Transform this criticism into NVC')
        expect(result.isPracticeMode).toBe(true)
        expect(result.mode).toBe('translate')
      })
    })

    describe('should detect specific component focus', () => {
      it('detects observations focus', () => {
        const result = detectPracticeMode('Practice making observations')
        expect(result.isPracticeMode).toBe(true)
        expect(result.focusComponent).toBe('observations')
      })

      it('detects feelings focus', () => {
        const result = detectPracticeMode('Help me practice identifying feelings')
        expect(result.isPracticeMode).toBe(true)
        expect(result.focusComponent).toBe('feelings')
      })

      it('detects needs focus', () => {
        const result = detectPracticeMode('I want to practice finding needs')
        expect(result.isPracticeMode).toBe(true)
        expect(result.focusComponent).toBe('needs')
      })

      it('detects requests focus', () => {
        const result = detectPracticeMode('Practice making requests instead of demands')
        expect(result.isPracticeMode).toBe(true)
        expect(result.focusComponent).toBe('requests')
      })
    })

    describe('should detect difficulty preference', () => {
      it('detects beginner difficulty', () => {
        const result = detectPracticeMode('Give me a beginner practice scenario')
        expect(result.difficulty).toBe('beginner')
      })

      it('detects intermediate difficulty', () => {
        const result = detectPracticeMode('I want an intermediate scenario')
        expect(result.difficulty).toBe('intermediate')
      })

      it('detects advanced difficulty', () => {
        const result = detectPracticeMode('Give me an advanced practice')
        expect(result.difficulty).toBe('advanced')
      })

      it('defaults to undefined when no difficulty specified', () => {
        const result = detectPracticeMode('Give me a practice scenario')
        expect(result.difficulty).toBeUndefined()
      })
    })

    describe('should detect conversation mode', () => {
      it('detects multi-turn mode request', () => {
        const result = detectPracticeMode('Guide me through a multi-turn practice')
        expect(result.conversationMode).toBe('multi')
      })

      it('detects single response mode request', () => {
        const result = detectPracticeMode('Give me a quick single practice')
        expect(result.conversationMode).toBe('single')
      })

      it('defaults to undefined when no mode specified', () => {
        const result = detectPracticeMode('Practice with me')
        expect(result.conversationMode).toBeUndefined()
      })
    })

    describe('should handle non-practice messages', () => {
      it('returns isPracticeMode=false for general questions', () => {
        const result = detectPracticeMode('What is NVC?')
        expect(result.isPracticeMode).toBe(false)
      })

      it('returns isPracticeMode=false for feelings lookup', () => {
        const result = detectPracticeMode('What feelings indicate unmet needs?')
        expect(result.isPracticeMode).toBe(false)
      })

      it('returns isPracticeMode=false for needs questions', () => {
        const result = detectPracticeMode('List universal human needs')
        expect(result.isPracticeMode).toBe(false)
      })
    })
  })
})

describe('Scenario Filtering', () => {
  const mockScenarios = [
    {
      title: 'Beginner Observations',
      difficulty: 'beginner',
      focus_component: 'observations',
      mode: 'single'
    },
    {
      title: 'Intermediate Feelings',
      difficulty: 'intermediate',
      focus_component: 'feelings',
      mode: 'single'
    },
    {
      title: 'Advanced Conflict',
      difficulty: 'advanced',
      focus_component: 'conflict_resolution',
      mode: 'multi'
    },
    {
      title: 'Beginner Full OFNR',
      difficulty: 'beginner',
      focus_component: 'all',
      mode: 'single'
    },
  ]

  describe('filterScenarios', () => {
    it('filters by difficulty', () => {
      const filter: ScenarioFilter = { difficulty: 'beginner' }
      const result = filterScenarios(mockScenarios, filter)

      expect(result).toHaveLength(2)
      expect(result.every(s => s.difficulty === 'beginner')).toBe(true)
    })

    it('filters by focus component', () => {
      const filter: ScenarioFilter = { focusComponent: 'feelings' }
      const result = filterScenarios(mockScenarios, filter)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Intermediate Feelings')
    })

    it('filters by conversation mode', () => {
      const filter: ScenarioFilter = { conversationMode: 'multi' }
      const result = filterScenarios(mockScenarios, filter)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Advanced Conflict')
    })

    it('combines multiple filters', () => {
      const filter: ScenarioFilter = {
        difficulty: 'beginner',
        focusComponent: 'observations'
      }
      const result = filterScenarios(mockScenarios, filter)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Beginner Observations')
    })

    it('returns all scenarios when no filter provided', () => {
      const result = filterScenarios(mockScenarios, {})
      expect(result).toHaveLength(4)
    })

    it('returns empty array when no scenarios match', () => {
      const filter: ScenarioFilter = {
        difficulty: 'advanced',
        focusComponent: 'observations'
      }
      const result = filterScenarios(mockScenarios, filter)

      expect(result).toHaveLength(0)
    })
  })
})

describe('PracticeMode Interface', () => {
  it('should have correct structure', () => {
    const practiceMode: PracticeMode = {
      isPracticeMode: true,
      mode: 'practice',
      focusComponent: 'feelings',
      difficulty: 'beginner',
      conversationMode: 'single'
    }

    expect(practiceMode).toHaveProperty('isPracticeMode')
    expect(practiceMode).toHaveProperty('mode')
    expect(practiceMode).toHaveProperty('focusComponent')
    expect(practiceMode).toHaveProperty('difficulty')
    expect(practiceMode).toHaveProperty('conversationMode')
  })
})
