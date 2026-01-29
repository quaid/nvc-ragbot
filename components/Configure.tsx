import { useState } from "react";
import Dropdown from "./Dropdown";
import Toggle from "./Toggle";
import Footer from "./Footer";
import { SimilarityMetric } from "../app/hooks/useConfiguration";
import { ProgressStats } from "../lib/progress-tracking";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  useRag: boolean;
  llm: string;
  similarityMetric: SimilarityMetric;
  setConfiguration: (useRag: boolean, llm: string, similarityMetric: SimilarityMetric) => void;
  progressEnabled?: boolean;
  progressStats?: ProgressStats;
  onProgressToggle?: (enabled: boolean) => void;
}

const Configure = ({
  isOpen,
  onClose,
  useRag,
  llm,
  similarityMetric,
  setConfiguration,
  progressEnabled = false,
  progressStats,
  onProgressToggle
}: Props) => {
  const [rag, setRag] = useState(useRag);
  const [selectedLlm, setSelectedLlm] = useState(llm);
  const [selectedSimilarityMetric, setSelectedSimilarityMetric] = useState<SimilarityMetric>(similarityMetric);
  const [trackProgress, setTrackProgress] = useState(progressEnabled);
  
  if (!isOpen) return null;

  const llmOptions = [
    { label: 'Llama 4 Maverick 17B', value: 'Llama-4-Maverick-17B-128E-Instruct-FP8' },
    { label: 'Llama 3.3 70B', value: 'Llama3.3-70B-Instruct' },
    { label: 'Llama 3.1 405B', value: 'Llama3.1-405B-Instruct' }
  ];

  const similarityMetricOptions = [
    { label: 'Cosine Similarity', value: 'cosine' },
    { label: 'Euclidean Distance', value: 'euclidean' },
    { label: 'Dot Product', value: 'dot_product' }
  ];

  const handleSave = () => {
    setConfiguration(
        rag,
        selectedLlm,
        selectedSimilarityMetric
    );
    if (onProgressToggle && trackProgress !== progressEnabled) {
      onProgressToggle(trackProgress);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="chatbot-section flex flex-col origin:w-[800px] w-full origin:h-[735px] h-full p-6 rounded shadow-lg overflow-auto">
        <div className="grow">
          <div className='pb-6 flex justify-between'>
            <h1 className='chatbot-text-primary text-xl md:text-2xl font-medium'>Configure</h1>
            <button
              onClick={onClose}
              className="chatbot-text-primary text-4xl font-thin leading-8"
            >
              <span aria-hidden>×</span>
            </button>
          </div>
          <div className="flex mb-4">
            <Dropdown
              fieldId="llm"
              label="LLM"
              options={llmOptions}
              value={selectedLlm}
              onSelect={setSelectedLlm}
            />
            <Toggle enabled={rag} label="Enable vector content (RAG)" onChange={() => setRag(!rag)} />
          </div>
          <Dropdown
            fieldId="similarityMetric"
            label="Similarity Metric"
            options={similarityMetricOptions}
            value={selectedSimilarityMetric}
            onSelect={setSelectedSimilarityMetric}
          />

          {/* Progress Tracking Section */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="chatbot-text-primary text-lg font-medium mb-4">Practice Progress</h2>
            <Toggle
              enabled={trackProgress}
              label="Track my NVC practice progress"
              onChange={() => setTrackProgress(!trackProgress)}
            />
            <p className="text-sm text-gray-500 mt-2 ml-1">
              {trackProgress
                ? "Your practice progress is stored locally on this device."
                : "Enable to track scenarios completed, streaks, and statistics."}
            </p>

            {/* Progress Stats Display */}
            {trackProgress && progressStats && progressStats.totalAttempts > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="backdrop-blur-sm bg-[#00A3A1]/5 rounded-lg p-3 border border-[#00A3A1]/20">
                  <div className="text-2xl font-bold text-[#00A3A1]">{progressStats.totalAttempts}</div>
                  <div className="text-xs text-gray-600">Total Attempts</div>
                </div>
                <div className="backdrop-blur-sm bg-[#28A36A]/5 rounded-lg p-3 border border-[#28A36A]/20">
                  <div className="text-2xl font-bold text-[#28A36A]">{progressStats.completionRate}%</div>
                  <div className="text-xs text-gray-600">Completion Rate</div>
                </div>
                <div className="backdrop-blur-sm bg-[#F6A135]/5 rounded-lg p-3 border border-[#F6A135]/20">
                  <div className="text-2xl font-bold text-[#F6A135]">{progressStats.streakDays}</div>
                  <div className="text-xs text-gray-600">Day Streak</div>
                </div>
                <div className="backdrop-blur-sm bg-purple-500/5 rounded-lg p-3 border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-600">
                    {progressStats.averageRating > 0 ? progressStats.averageRating.toFixed(1) : '-'}
                  </div>
                  <div className="text-xs text-gray-600">Avg Rating</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="self-end w-full">
          <div className="flex justify-end gap-2">
            <button
              className='chatbot-button-secondary flex rounded-md items-center justify-center px-2.5 py-3'
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className='chatbot-button-primary flex rounded-md items-center justify-center px-2.5 py-3'
              onClick={handleSave}
            >
              Save Configuration
            </button>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Configure;
