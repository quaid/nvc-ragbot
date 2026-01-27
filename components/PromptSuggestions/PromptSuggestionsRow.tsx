"use client";
import { useState, useEffect } from "react";
import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionRow = ({ onPromptClick }) => {
  // NVC prompts organized by learning progression: Basics → Practice → Advanced
  const allPrompts = [
    // === BASICS: Understanding NVC ===

    // Four Components
    'What are the four components of Nonviolent Communication?',
    'How do I make observations without evaluations?',
    'What is the difference between feelings and thoughts?',
    'What are universal human needs in NVC?',
    'How do I make requests instead of demands?',

    // Feelings Vocabulary
    'What feelings might I have when my needs are met?',
    'What feelings signal that my needs are not being met?',
    'Help me expand my feelings vocabulary',
    'What is the difference between "I feel ignored" and a true feeling?',

    // Needs Vocabulary
    'What are the main categories of universal human needs?',
    'Help me identify my underlying needs',
    'Why are needs never in conflict according to NVC?',
    'What needs might be behind anger?',

    // === PRACTICE: Applying NVC ===

    // Translation Practice
    'Help me translate "You never listen to me!" into NVC',
    'How would I express criticism using the OFNR format?',
    'Transform "That\'s a stupid idea" into giraffe language',
    'Help me practice translating a demand into a request',

    // Empathy Practice
    'How do I give empathy to someone who is upset?',
    'What is the difference between empathy and sympathy?',
    'Practice empathic listening with me',
    'How do I empathize without fixing or advising?',

    // Self-Empathy
    'Guide me through self-empathy when I feel triggered',
    'How do I practice self-empathy before a difficult conversation?',
    'I\'m feeling frustrated - help me connect with my needs',
    'What is self-compassion in NVC?',

    // Conflict Resolution
    'How can NVC help resolve a conflict I\'m having?',
    'Guide me through the NVC conflict resolution process',
    'How do I stay connected when someone says no to my request?',
    'Help me prepare for a difficult conversation using NVC',

    // === ADVANCED: Deepening Practice ===

    // Jackal to Giraffe
    'What are jackal and giraffe language in NVC?',
    'How do I translate my inner jackal thoughts?',
    'Help me hear the needs behind someone\'s criticism',
    'How do I respond to blame with empathy?',

    // Enemy Images
    'How do I transform enemy images about someone?',
    'I\'m holding a judgment - help me find the needs underneath',
    'How do I see the humanity in someone I\'m angry with?',

    // Saying and Hearing No
    'How do I say no in NVC without disconnecting?',
    'Help me hear the yes behind someone\'s no',
    'How do I maintain connection when declining a request?',

    // Daily Practice
    'What are some daily NVC practice exercises?',
    'How do I integrate NVC into my daily life?',
    'Give me a self-empathy practice I can do each morning',

    // Specific Situations
    'How do I use NVC with my partner?',
    'Can you help me with a workplace situation using NVC?',
    'How do I use NVC with children?',
    'Help me express gratitude using NVC principles',
  ];

  const [displayedPrompts, setDisplayedPrompts] = useState<string[]>([]);

  // Function to get 4 random prompts
  const shufflePrompts = () => {
    const shuffled = [...allPrompts].sort(() => Math.random() - 0.5);
    setDisplayedPrompts(shuffled.slice(0, 4));
  };

  // Initialize with random prompts on mount
  useEffect(() => {
    shufflePrompts();
  }, []);

  return (
    <div className="flex flex-col gap-2 py-3">
      <div className="flex flex-row flex-wrap justify-start items-center gap-2">
        {displayedPrompts.map((prompt, index) => (
          <PromptSuggestionButton
            key={`suggestion-${index}-${prompt.slice(0, 10)}`}
            text={prompt}
            onClick={() => onPromptClick(prompt)}
          />
        ))}
        {/* Enhanced Shuffle Button */}
        <button
          onClick={shufflePrompts}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md bg-gradient-to-r from-[#28A36A] to-[#00A3A1] text-white text-sm font-medium shadow-lg shadow-[#28A36A]/30 hover:shadow-xl hover:shadow-[#28A36A]/40 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#28A36A]/50"
          title="Get new suggestions"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="group-hover:rotate-180 transition-transform duration-500"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          <span className="font-semibold">More</span>
        </button>
      </div>
    </div>
  );
};

export default PromptSuggestionRow;
