import Loading from "@/components/UI/loading";
import config from "@/config/config";
import GrammarCard from "@/components/Layout/grammar-card";
import { ItemCard } from "@/components/UI/item-card";
import { PracticeControls } from "@/components/UI/practice-controls";
import { usePracticeLogic } from "@/hooks/use-practice-logic";

export default function Practice() {
  const {
    revealed,
    setRevealed,
    hintIndex,
    setHintIndex,
    grammarVisible,
    setGrammarVisible,
    handleNext,
    playAudioForItem,
    isAudioDisabled,
    currentItem,
    direction,
    hasGrammar,
    index,
    userStats,
    playAudio,
    setVolume,
    audioError,
  } = usePracticeLogic();

  if (!currentItem)
    return <Loading text="Nic k procvičování. Zkuste to znovu později." />;

  return grammarVisible ? (
    <GrammarCard
      grammar_id={currentItem?.grammar_id}
      onClose={() => setGrammarVisible(false)}
    />
  ) : (
    <div className="card-height card-width">
      {/* Card content with item details */}
      <ItemCard
        currentItem={currentItem}
        direction={direction}
        revealed={revealed}
        hintIndex={hintIndex}
        isAudioDisabled={isAudioDisabled}
        audioError={audioError}
        userStats={userStats}
        index={index}
        playAudio={playAudio}
        setVolume={setVolume}
      />

      {/* Practice Controls */}
      <PracticeControls
        revealed={revealed}
        hasGrammar={hasGrammar}
        direction={direction}
        handleNext={handleNext}
        setRevealed={setRevealed}
        setHintIndex={setHintIndex}
        setGrammarVisible={setGrammarVisible}
        playAudioForItem={playAudioForItem}
        config={config}
      />
    </div>
  );
}
