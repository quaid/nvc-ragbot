/**
 * Practice Mode Module
 *
 * Handles NVC practice mode detection, scenario filtering, and
 * configuration for interactive learning experiences.
 */

/**
 * NVC Components that can be focused on during practice
 */
export type NVCComponent = 'observations' | 'feelings' | 'needs' | 'requests'

/**
 * Difficulty levels for practice scenarios
 */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

/**
 * Conversation modes for practice
 */
export type ConversationMode = 'single' | 'multi'

/**
 * Practice mode types
 */
export type PracticeModeType = 'practice' | 'translate'

/**
 * Result of detecting practice mode from user input
 */
export interface PracticeMode {
  isPracticeMode: boolean
  mode?: PracticeModeType
  focusComponent?: NVCComponent
  difficulty?: Difficulty
  conversationMode?: ConversationMode
}

/**
 * Filter criteria for scenario selection
 */
export interface ScenarioFilter {
  difficulty?: Difficulty
  focusComponent?: string
  conversationMode?: ConversationMode
}

/**
 * Scenario structure from the scenarios database
 */
export interface Scenario {
  title: string
  difficulty: string
  focus_component: string
  mode: string
  [key: string]: unknown
}

/**
 * Detects if the user message indicates a practice mode request
 * and extracts relevant parameters.
 *
 * @param message - The user's input message
 * @returns PracticeMode object with detected settings
 */
export function detectPracticeMode(message: string): PracticeMode {
  const lowerMessage = message.toLowerCase()

  // Check for practice mode keywords
  const practiceKeywords = ['practice', 'scenario']
  const translateKeywords = ['translate', 'transform']

  const isPractice = practiceKeywords.some(keyword => lowerMessage.includes(keyword))
  const isTranslate = translateKeywords.some(keyword => lowerMessage.includes(keyword))

  const isPracticeMode = isPractice || isTranslate

  if (!isPracticeMode) {
    return { isPracticeMode: false }
  }

  const result: PracticeMode = {
    isPracticeMode: true,
    mode: isTranslate ? 'translate' : 'practice'
  }

  // Detect focus component
  const componentPatterns: Record<NVCComponent, RegExp> = {
    observations: /\bobservation/i,
    feelings: /\bfeelings?\b/i,
    needs: /\bneeds?\b/i,
    requests: /\brequests?\b/i
  }

  for (const [component, pattern] of Object.entries(componentPatterns)) {
    if (pattern.test(lowerMessage)) {
      result.focusComponent = component as NVCComponent
      break
    }
  }

  // Detect difficulty level
  if (lowerMessage.includes('beginner')) {
    result.difficulty = 'beginner'
  } else if (lowerMessage.includes('intermediate')) {
    result.difficulty = 'intermediate'
  } else if (lowerMessage.includes('advanced')) {
    result.difficulty = 'advanced'
  }

  // Detect conversation mode
  if (lowerMessage.includes('multi-turn') || lowerMessage.includes('multi turn')) {
    result.conversationMode = 'multi'
  } else if (lowerMessage.includes('single') || lowerMessage.includes('quick')) {
    result.conversationMode = 'single'
  }

  return result
}

/**
 * Filters scenarios based on the provided criteria
 *
 * @param scenarios - Array of scenarios to filter
 * @param filter - Filter criteria
 * @returns Filtered array of scenarios
 */
export function filterScenarios(
  scenarios: Scenario[],
  filter: ScenarioFilter
): Scenario[] {
  return scenarios.filter(scenario => {
    // Filter by difficulty
    if (filter.difficulty && scenario.difficulty !== filter.difficulty) {
      return false
    }

    // Filter by focus component
    if (filter.focusComponent && scenario.focus_component !== filter.focusComponent) {
      return false
    }

    // Filter by conversation mode
    if (filter.conversationMode && scenario.mode !== filter.conversationMode) {
      return false
    }

    return true
  })
}
