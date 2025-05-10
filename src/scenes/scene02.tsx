// src/scenes/scene02.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components";

//region Styled Components (Copied and adapted from Scene01)
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const SceneWrapper = styled.div`
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
  background-color: #f0f2f5;
  color: #333;
  min-height: 100vh;
  box-sizing: border-box;

  @media (max-width: 600px) {
    padding: 15px 10px;
  }
`;

const Header = styled.header`
  margin-bottom: 20px;
  text-align: center;
  h1 {
    color: #2c3e50;
    margin-bottom: 5px;
    font-size: 2em;
    @media (max-width: 600px) {
      font-size: 1.8em;
    }
  }
  h2 {
    color: #34495e;
    font-size: 1.2em;
    margin-top: 0;
    @media (max-width: 600px) {
      font-size: 1.1em;
    }
  }
`;

const SceneDescription = styled.p`
  font-style: italic;
  color: #555;
  text-align: center;
  margin-bottom: 15px;
  background-color: #fff;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  @media (max-width: 600px) {
    font-size: 0.95em;
  }
`;

const StoryMessageDisplay = styled.div`
  background-color: #e8f4fd;
  border-left: 5px solid #2196f3;
  padding: 15px;
  margin: 20px 0;
  font-size: 1em;
  color: #1e88e5;
  border-radius: 4px;
  min-height: 20px;
  animation: ${fadeIn} 0.5s ease-out;

  @media (max-width: 600px) {
    font-size: 0.9em;
    padding: 12px;
    margin: 15px 0;
  }
`;

const MainLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 767px) {
    gap: 15px;
  }

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const Panel = styled.section`
  background-color: #ffffff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex: 1;

  @media (max-width: 600px) {
    padding: 12px;
  }
`;

const StatsPanel = styled(Panel)``;
const ActionsPanel = styled(Panel)``;
const UpgradesPanel = styled(Panel)``;

const PanelTitle = styled.h3`
  margin-top: 0;
  color: #3498db;
  border-bottom: 2px solid #ecf0f1;
  padding-bottom: 10px;
  font-size: 1.3em;

  @media (max-width: 600px) {
    font-size: 1.15em;
    padding-bottom: 8px;
  }
`;

const StatItem = styled.p`
  margin: 8px 0;
  font-size: 0.95em;
  strong {
    color: #2980b9;
  }
  @media (max-width: 600px) {
    font-size: 0.9em;
    margin: 6px 0;
  }
`;

const Button = styled.button`
  background-color: #3498db;
  color: white;
  border: none;
  padding: 10px 15px;
  margin: 5px 0;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1em;
  transition: background-color 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  &:hover:not(:disabled) {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  @media (max-width: 400px) {
    font-size: 0.9em;
    padding: 8px 12px;
  }
`;

const UpgradeButton = styled(Button)`
  background-color: #2ecc71;
  &:hover:not(:disabled) {
    background-color: #27ae60;
  }
  &.purchased {
    background-color: #95a5a6;
    color: #ecf0f1;
    cursor: default;
  }
`;

const PrimaryActionButton = styled(Button)`
  background-color: #2ecc71;
  padding: 12px 25px;
  font-size: 1em;

  &:hover:not(:disabled) {
    background-color: #27ae60;
  }
`;

const UpgradeCategory = styled.div`
  margin-bottom: 20px;
  h4 {
    font-size: 1.1em;
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
    @media (max-width: 600px) {
      font-size: 1em;
    }
  }
`;

const UpgradeItem = styled.div`
  background-color: #f9f9f9;
  border: 1px solid #eee;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;

  p {
    margin: 5px 0;
    font-size: 0.9em;
  }
  small {
    color: #7f8c8d;
    font-size: 0.8em;
  }

  @media (max-width: 600px) {
    padding: 8px;
    p {
      font-size: 0.85em;
    }
    small {
      font-size: 0.75em;
    }
  }
`;

const SceneCompletionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 15px;
  animation: ${fadeIn} 0.3s ease-out;
  box-sizing: border-box;
`;

const SceneCompletionMessage = styled.div`
  background-color: white;
  padding: 30px 40px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  animation: ${fadeIn} 0.5s ease-out 0.2s;
  animation-fill-mode: backwards;
  width: 100%;
  max-width: 500px;
  box-sizing: border-box;

  h2 {
    color: #2c3e50;
    margin-top: 0;
    font-size: 1.8em;
  }
  p {
    color: #34495e;
    font-size: 1.1em;
    margin-bottom: 25px;
  }

  @media (max-width: 600px) {
    padding: 20px;
    h2 {
      font-size: 1.5em;
    }
    p {
      font-size: 1em;
      margin-bottom: 20px;
    }
  }
`;

const ToggleSwitchContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 15px 0;
  font-size: 0.95em;

  label {
    margin-right: 10px;
    color: #555;
  }
`;

const ToggleSwitchLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 50px; /* Adjusted width */
  height: 28px; /* Adjusted height */
`;

const ToggleSwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #2ecc71; /* Green when on */
  }

  &:focus + span {
    box-shadow: 0 0 1px #2ecc71;
  }

  &:checked + span:before {
    transform: translateX(22px); /* Adjusted translation */
  }
`;

const ToggleSwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 28px; /* Adjusted for height */

  &:before {
    position: absolute;
    content: "";
    height: 20px; /* Adjusted size */
    width: 20px; /* Adjusted size */
    left: 4px; /* Adjusted position */
    bottom: 4px; /* Adjusted position */
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;
//endregion

//region Types and Initial Data
interface Scene02Props {
  onComplete: () => void;
}

interface CopilotUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number; // IT Budget
}

interface CopilotFactory extends CopilotUpgrade {
  lps: number; // LoC Per Second
}

interface CopilotClickUpgrade extends CopilotUpgrade {
  lppIncrease: number; // Lines Per Prompt Increase
}

const INITIAL_COPILOT_FACTORIES: CopilotFactory[] = [
  {
    id: "copilot-gpt35",
    name: "Basic Model (GPT 3.5)",
    description: "Standard assistant with average accuracy.",
    cost: 50,
    lps: 2,
  },
  {
    id: "copilot-comment-aware",
    name: "Comment-Aware Prompting Engine",
    description: "Learns from structured comments.",
    cost: 120,
    lps: 4,
  },
  {
    id: "copilot-syntax-optimizer",
    name: "Syntax Prediction Optimizer",
    description: "Reduces nonsense output.",
    cost: 300,
    lps: 6,
  },
  {
    id: "copilot-context-extender",
    name: "Context Window Extender",
    description: "Remembers more of your past code.",
    cost: 500,
    lps: 8,
  },
  {
    id: "copilot-gpt4-turbo",
    name: "Next-Gen Model (GPT-4 Turbo)",
    description: "High-accuracy suggestions, rarely wrong.",
    cost: 1000,
    lps: 12,
  },
];

const INITIAL_CLICK_UPGRADES: CopilotClickUpgrade[] = [
  {
    id: "click-smart-prompting",
    name: "Smart Prompting Guide",
    description: "(+1 line/prompt)",
    cost: 25,
    lppIncrease: 1,
  },
  {
    id: "click-tab-enhancer",
    name: "Autocomplete Tab Enhancer",
    description: "(+2 lines/prompt)",
    cost: 75,
    lppIncrease: 2,
  },
  {
    id: "click-scope-analyzer",
    name: "Feature Scope Analyzer",
    description: "(+3 lines/prompt)",
    cost: 150,
    lppIncrease: 3,
  },
];

const STORY_MESSAGES_SCENE02 = {
  intro:
    "Bob installs Copilot. He’s not sure whether to feel excited or replaceable.",
  firstPrompt: "A line appears. Not what Bob meant, but eerily close.",
  firstFeature: "That was fast. Boss raises an eyebrow.",
  threeFeatures:
    "Bob starts commenting before writing—Copilot responds better that way.",
  qualityLow: "Code’s piling up. It's working, but barely holding together.",
  refactorOn: "Time to clean up. Bob sighs and braces for real work.",
  budget1000:
    "The team officially approves Copilot. ‘Just keep shipping,’ says the boss.",
  qualityHighRefactor: "The code feels smooth again. Not perfect, but clean.",
  sceneEnd:
    "Bob’s efficiency skyrockets. He’s no longer just writing code—he’s directing it.",
};
//endregion

const Scene02: React.FC<Scene02Props> = ({ onComplete }) => {
  //region State Variables
  const [copilotLoc, setCopilotLoc] = useState<number>(0);
  const [featuresCompleted, setFeaturesCompleted] = useState<number>(0);
  const [itBudget, setItBudget] = useState<number>(0);
  const [codeQuality, setCodeQuality] = useState<number>(100);
  const [isRefactorMode, setIsRefactorMode] = useState<boolean>(false);
  const [linesPerPrompt, setLinesPerPrompt] = useState<number>(1);
  const [copilotLocPerSecond, setCopilotLocPerSecond] = useState<number>(0);

  const [purchasedCopilotFactoryIds, setPurchasedCopilotFactoryIds] = useState<
    Set<string>
  >(new Set());
  const [purchasedClickUpgradeIds, setPurchasedClickUpgradeIds] = useState<
    Set<string>
  >(new Set());

  const [storyMessage, setStoryMessage] = useState<string>("");
  const [shownMessages, setShownMessages] = useState<Set<string>>(new Set());

  const [hasClickedPromptCopilot, setHasClickedPromptCopilot] =
    useState<boolean>(false);
  const [isSceneComplete, setIsSceneComplete] = useState<boolean>(false);
  //endregion

  //region Story Message Handler
  const showStoryMessage = useCallback(
    (key: keyof typeof STORY_MESSAGES_SCENE02, customMessage?: string) => {
      if (!shownMessages.has(key) && !isSceneComplete) {
        setStoryMessage(customMessage || STORY_MESSAGES_SCENE02[key]);
        setShownMessages((prev) => new Set(prev).add(key));
      }
    },
    [shownMessages, isSceneComplete]
  );
  //endregion

  //region Game Logic Effects
  useEffect(() => {
    showStoryMessage("intro");
  }, [showStoryMessage]);

  useEffect(() => {
    if (copilotLocPerSecond > 0 && !isSceneComplete) {
      const intervalId = setInterval(() => {
        setCopilotLoc((prevLoc) => prevLoc + copilotLocPerSecond);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [copilotLocPerSecond, isSceneComplete]);

  // Story Triggers
  useEffect(() => {
    if (hasClickedPromptCopilot) showStoryMessage("firstPrompt");
  }, [hasClickedPromptCopilot, showStoryMessage]);

  useEffect(() => {
    if (featuresCompleted === 1) showStoryMessage("firstFeature");
    if (featuresCompleted === 3) showStoryMessage("threeFeatures");
  }, [featuresCompleted, showStoryMessage]);

  useEffect(() => {
    if (codeQuality < 70 && !shownMessages.has("qualityLow"))
      showStoryMessage("qualityLow");
  }, [codeQuality, showStoryMessage, shownMessages]);

  useEffect(() => {
    if (isRefactorMode && !shownMessages.has("refactorOn"))
      showStoryMessage("refactorOn");
  }, [isRefactorMode, showStoryMessage, shownMessages]);

  useEffect(() => {
    if (itBudget >= 1000) showStoryMessage("budget1000");
  }, [itBudget, showStoryMessage]);

  useEffect(() => {
    if (
      codeQuality >= 90 &&
      isRefactorMode &&
      !shownMessages.has("qualityHighRefactor")
    ) {
      showStoryMessage("qualityHighRefactor");
    }
  }, [codeQuality, isRefactorMode, showStoryMessage, shownMessages]);

  // Scene Completion
  useEffect(() => {
    if (featuresCompleted >= 10 && codeQuality >= 80 && !isSceneComplete) {
      setIsSceneComplete(true);
      // Final story message before overlay will be the sceneEnd one.
      setStoryMessage(STORY_MESSAGES_SCENE02.sceneEnd);
    }
  }, [featuresCompleted, codeQuality, isSceneComplete]);
  //endregion

  //region Event Handlers
  const handlePromptCopilot = () => {
    if (isSceneComplete) return;
    setCopilotLoc((prev) => prev + linesPerPrompt);
    if (!hasClickedPromptCopilot) setHasClickedPromptCopilot(true);
  };

  const handleImplementFeature = () => {
    if (isSceneComplete || isRefactorMode) return;

    let featureSize = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;
    if (codeQuality < 60) {
      featureSize = Math.floor(featureSize * 1.25);
    }

    if (copilotLoc < featureSize) {
      alert(
        `Not enough Copilot LoC. Need ${featureSize}, have ${copilotLoc.toFixed(
          0
        )}.`
      );
      return;
    }

    setCopilotLoc((prev) => prev - featureSize);
    setFeaturesCompleted((prev) => prev + 1);
    setItBudget((prev) => prev + featureSize * 0.1);

    let qualityReduction = 0;
    if (featureSize <= 300) qualityReduction = 2;
    else if (featureSize <= 700) qualityReduction = 5;
    else qualityReduction = 10;

    setCodeQuality((prev) => Math.max(0, prev - qualityReduction));
  };

  const handleRefactorCode = () => {
    if (isSceneComplete || !isRefactorMode || copilotLoc < 50) return;

    setCopilotLoc((prev) => prev - 50);
    setCodeQuality((prev) => Math.min(100, prev + 1));
  };

  const handleToggleRefactorMode = () => {
    if (isSceneComplete) return;
    const newMode = !isRefactorMode;
    setIsRefactorMode(newMode);
    if (newMode) {
      // only show message when toggling ON
      // This ensures the message is shown *after* the state update
      // and won't re-trigger if shownMessages already contains "refactorOn".
      if (!shownMessages.has("refactorOn")) {
        showStoryMessage("refactorOn");
      }
    }
  };

  const handleBuyCopilotFactory = (factory: CopilotFactory) => {
    if (
      isSceneComplete ||
      itBudget < factory.cost ||
      purchasedCopilotFactoryIds.has(factory.id)
    )
      return;
    setItBudget((prev) => prev - factory.cost);
    setPurchasedCopilotFactoryIds((prev) => new Set(prev).add(factory.id));
    setCopilotLocPerSecond((prevLps) => prevLps + factory.lps);
  };

  const handleBuyClickUpgrade = (upgrade: CopilotClickUpgrade) => {
    if (
      isSceneComplete ||
      itBudget < upgrade.cost ||
      purchasedClickUpgradeIds.has(upgrade.id)
    )
      return;
    setItBudget((prev) => prev - upgrade.cost);
    setPurchasedClickUpgradeIds((prev) => new Set(prev).add(upgrade.id));
    setLinesPerPrompt((prevLpp) => prevLpp + upgrade.lppIncrease);
  };
  //endregion

  const currentCopilotLPS = useMemo(
    () => copilotLocPerSecond.toFixed(1),
    [copilotLocPerSecond]
  );

  return (
    <SceneWrapper>
      <Header>
        <h1>Chapter 2. The Copilot Era</h1>
        <h2>Scene: The Copilot Era</h2>
      </Header>
      <SceneDescription>
        Bob has been granted access to GitHub Copilot. At first, he's uncertain.
        The tool seems to guess what he's doing, offering suggestions mid-line.
        Sometimes it’s brilliant. Sometimes it's laughably wrong. But Bob soon
        discovers that directing Copilot with comments yields better results.
        His workflow changes—less typing, more prompting, and frequent tabbing.
        Now, it’s less about writing code and more about orchestrating it.
      </SceneDescription>

      {storyMessage &&
        (!isSceneComplete ||
          storyMessage === STORY_MESSAGES_SCENE02.sceneEnd) && ( // Show sceneEnd message before overlay
          <StoryMessageDisplay>{storyMessage}</StoryMessageDisplay>
        )}

      <MainLayout>
        <StatsPanel>
          <PanelTitle>Stats</PanelTitle>
          <StatItem>
            <strong>Copilot LoC:</strong> {copilotLoc.toFixed(0)}
          </StatItem>
          <StatItem>
            <strong>Features Completed:</strong> {featuresCompleted}
          </StatItem>
          <StatItem>
            <strong>IT Budget:</strong> ${itBudget.toFixed(2)}
          </StatItem>
          <StatItem>
            <strong>Code Quality:</strong> {codeQuality}%
          </StatItem>
          <StatItem>
            <strong>Lines per Prompt:</strong> {linesPerPrompt}
          </StatItem>
          <StatItem>
            <strong>LoC per Second:</strong> {currentCopilotLPS}
          </StatItem>
        </StatsPanel>

        <ActionsPanel>
          <PanelTitle>Actions</PanelTitle>
          <Button onClick={handlePromptCopilot} disabled={isSceneComplete}>
            Prompt Copilot
          </Button>

          <ToggleSwitchContainer>
            <label htmlFor="refactorToggleSwitch">Refactor Mode:</label>
            <ToggleSwitchLabel htmlFor="refactorToggleSwitch">
              <ToggleSwitchInput
                id="refactorToggleSwitch"
                type="checkbox"
                checked={isRefactorMode}
                onChange={handleToggleRefactorMode}
                disabled={isSceneComplete}
              />
              <ToggleSwitchSlider />
            </ToggleSwitchLabel>
          </ToggleSwitchContainer>

          {isRefactorMode ? (
            <Button
              onClick={handleRefactorCode}
              disabled={isSceneComplete || copilotLoc < 50}
            >
              Refactor Code (50 LoC for +1% Quality)
            </Button>
          ) : (
            <Button onClick={handleImplementFeature} disabled={isSceneComplete}>
              Implement Feature
            </Button>
          )}
          {!isRefactorMode && (
            <small
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "5px",
                fontSize: "0.8em",
              }}
            >
              Cost: Random (100-1000 LoC), affected by Quality
            </small>
          )}
        </ActionsPanel>

        <UpgradesPanel>
          <PanelTitle>Copilot Upgrades</PanelTitle>
          <UpgradeCategory>
            <h4>Automation (Factories)</h4>
            {INITIAL_COPILOT_FACTORIES.map((factory) => (
              <UpgradeItem key={factory.id}>
                <strong>{factory.name}</strong> (+{factory.lps}/sec)
                <p>{factory.description}</p>
                <small>Cost: ${factory.cost.toFixed(2)}</small>
                <UpgradeButton
                  onClick={() => handleBuyCopilotFactory(factory)}
                  disabled={
                    itBudget < factory.cost ||
                    purchasedCopilotFactoryIds.has(factory.id) ||
                    isSceneComplete
                  }
                  className={
                    purchasedCopilotFactoryIds.has(factory.id)
                      ? "purchased"
                      : ""
                  }
                >
                  {purchasedCopilotFactoryIds.has(factory.id)
                    ? "Purchased"
                    : `Buy ($${factory.cost.toFixed(2)})`}
                </UpgradeButton>
              </UpgradeItem>
            ))}
          </UpgradeCategory>
          <UpgradeCategory>
            <h4>Click Improvements</h4>
            {INITIAL_CLICK_UPGRADES.map((upgrade) => (
              <UpgradeItem key={upgrade.id}>
                <strong>{upgrade.name}</strong>
                <p>{upgrade.description}</p>
                <small>Cost: ${upgrade.cost.toFixed(2)}</small>
                <UpgradeButton
                  onClick={() => handleBuyClickUpgrade(upgrade)}
                  disabled={
                    itBudget < upgrade.cost ||
                    purchasedClickUpgradeIds.has(upgrade.id) ||
                    isSceneComplete
                  }
                  className={
                    purchasedClickUpgradeIds.has(upgrade.id) ? "purchased" : ""
                  }
                >
                  {purchasedClickUpgradeIds.has(upgrade.id)
                    ? "Purchased"
                    : `Buy ($${upgrade.cost.toFixed(2)})`}
                </UpgradeButton>
              </UpgradeItem>
            ))}
          </UpgradeCategory>
        </UpgradesPanel>
      </MainLayout>

      {isSceneComplete && (
        <SceneCompletionOverlay>
          <SceneCompletionMessage>
            <h2>Scene Complete!</h2>
            <p>{STORY_MESSAGES_SCENE02.sceneEnd}</p>
            <PrimaryActionButton onClick={onComplete}>
              Continue to Next Scene
            </PrimaryActionButton>
          </SceneCompletionMessage>
        </SceneCompletionOverlay>
      )}
    </SceneWrapper>
  );
};

export default Scene02;
