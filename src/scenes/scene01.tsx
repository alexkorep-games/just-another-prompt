import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components"; // Added css import

//region Styled Components
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

const StickyNote = styled.div`
  background-color: #fffacd; /* LemonChiffon */
  padding: 15px;
  font-family: "Comic Sans MS", "Chalkboard SE", "Marker Felt", sans-serif;
  font-size: 0.9em;
  text-align: center;
  width: 220px;
  height: 120px;
  box-shadow: 5px 5px 7px rgba(33, 33, 33, 0.7);
  transform: rotate(2deg);
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0d4a4;
  z-index: 10;

  p {
    margin: 2px 0;
  }

  @media (max-width: 600px) {
    position: static;
    margin: 10px auto 20px;
    transform: none;
    width: 90%;
    height: auto;
    padding: 10px; /* Adjusted padding for mobile */
    font-size: 0.85em; /* Slightly smaller font on mobile */
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
    /* Up to the point it becomes row */
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
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none; /* Firefox */
  -ms-user-select: none; /* IE10+/Edge */
  user-select: none; /* Standard */

  &:hover:not(:disabled) {
    background-color: #2980b9;
  }

  &:disabled {
    background-color: #bdc3c7;
    cursor: not-allowed;
  }

  @media (max-width: 400px) {
    /* For very small screens */
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

  @media (max-width: 600px) {
    padding: 10px 20px;
    font-size: 0.95em;
  }
  @media (max-width: 400px) {
    padding: 8px 15px;
    font-size: 0.9em; /* Overrides general button's 0.9em for this specific one if needed, or remove if same */
  }
`;

const Input = styled.input`
  padding: 8px;
  margin: 5px 0 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%; /* Changed from calc */
  box-sizing: border-box;
  font-size: 0.95em; /* Added for consistency */

  @media (max-width: 600px) {
    font-size: 0.9em;
  }
`;

const UpgradeCategory = styled.div`
  margin-bottom: 20px;
  h4 {
    /* Style the h4 inside UpgradeCategory */
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
  padding: 15px; /* Add some padding for the overlay itself on small screens */
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
  width: 100%; /* Take available width within overlay padding */
  max-width: 500px; /* Limit max width on larger screens */
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
//endregion

//region Types and Initial Data
interface Scene01Props {
  onComplete: () => void;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
}

interface Factory extends Upgrade {
  lps: number; // Lines Per Second
}

interface ClickImprovement extends Upgrade {
  lpcIncrease: number; // Lines Per Click Increase
}

const INITIAL_FACTORIES: Factory[] = [
  {
    id: "factory-text-editor-plugin",
    name: "Text Editor Plugin",
    description: "A lightweight plugin that remembers your last indent level.",
    cost: 50,
    lps: 0.5,
  },
  {
    id: "factory-syntax-highlighter",
    name: "Syntax Highlighter",
    description: "Highlights code blocks to improve visibility and speed.",
    cost: 100,
    lps: 1,
  },
  {
    id: "factory-autocomplete-module",
    name: "Autocomplete Module",
    description: "Suggests common code completions.",
    cost: 250,
    lps: 2,
  },
  {
    id: "factory-function-parameter-helper",
    name: "Function Parameter Helper",
    description: "Shows parameter hints inline as you type.",
    cost: 500,
    lps: 4,
  },
];

const INITIAL_CLICK_IMPROVEMENTS: ClickImprovement[] = [
  {
    id: "click-syntax-highlight",
    name: "Syntax Highlight",
    description: "(lines per click: +1)",
    cost: 25,
    lpcIncrease: 1,
  },
  {
    id: "click-code-autocompletion",
    name: "Code Autocompletion",
    description: "(lines per click: +2)",
    cost: 75,
    lpcIncrease: 2,
  },
  {
    id: "click-parameter-hinting",
    name: "Parameter Hinting",
    description: "(lines per click: +3)",
    cost: 150,
    lpcIncrease: 3,
  },
];

const STORY_MESSAGES = {
  intro:
    "Bob takes his first job as a junior developer. Time to impress the boss.",
  loc100: "Bob’s fingers are starting to remember the keys. Momentum builds.",
  firstTask: "Boss gives a brief nod. That felt... validating.",
  syntaxHighlighterUnlocked:
    "Colors bloom on the screen. Code is now a bit more beautiful.",
  approval50: "Your manager sends a smiling emoji in chat. That's rare.",
  approval100: "Well done. Bob is no longer the new guy—he's *our* guy now.",
  sceneEnd:
    "Bob’s performance review goes surprisingly well. A promotion may be on the horizon.",
};
//endregion

const Scene01: React.FC<Scene01Props> = ({ onComplete }) => {
  //region State Variables
  const [loc, setLoc] = useState<number>(0);
  const [bossApproval, setBossApproval] = useState<number>(0);
  const [closedTasks, setClosedTasks] = useState<number>(0);
  const [linesPerClick, setLinesPerClick] = useState<number>(1);
  const [locPerSecond, setLocPerSecond] = useState<number>(0);

  const [purchasedFactoryIds, setPurchasedFactoryIds] = useState<Set<string>>(
    new Set()
  );
  const [purchasedClickImprovementIds, setPurchasedClickImprovementIds] =
    useState<Set<string>>(new Set());

  const [storyMessage, setStoryMessage] = useState<string>("");
  const [shownMessages, setShownMessages] = useState<Set<string>>(new Set());

  const [isCompletingTask, setIsCompletingTask] = useState<boolean>(false);
  const [taskCooldown, setTaskCooldown] = useState<number>(0);
  const [taskSizeInput, setTaskSizeInput] = useState<string>("50");
  const [taskDetailsForCompletion, setTaskDetailsForCompletion] = useState<{
    size: number;
  } | null>(null);

  const [isSceneComplete, setIsSceneComplete] = useState<boolean>(false);
  //endregion

  //region Story Message Handler
  const showStoryMessage = useCallback(
    (key: keyof typeof STORY_MESSAGES, customMessage?: string) => {
      if (!shownMessages.has(key) && !isSceneComplete) {
        setStoryMessage(customMessage || STORY_MESSAGES[key]);
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
    if (locPerSecond > 0 && !isSceneComplete) {
      const intervalId = setInterval(() => {
        setLoc((prevLoc) => prevLoc + locPerSecond);
      }, 1000);
      return () => clearInterval(intervalId);
    }
  }, [locPerSecond, isSceneComplete]);

  useEffect(() => {
    let timerId: number;
    if (isCompletingTask && taskCooldown > 0 && !isSceneComplete) {
      timerId = window.setTimeout(() => {
        setTaskCooldown((prev) => prev - 1);
      }, 1000);
    } else if (
      isCompletingTask &&
      taskCooldown === 0 &&
      taskDetailsForCompletion &&
      !isSceneComplete
    ) {
      const currentClosedTasksCount = closedTasks;
      setClosedTasks((prev) => prev + 1);

      const approvalGained = (() => {
        const size = taskDetailsForCompletion.size;
        if (size >= 500) return 15;
        if (size >= 250) return 7;
        if (size >= 100) return 3;
        if (size >= 50) return 1;
        return 0;
      })();
      setBossApproval((prev) => Math.min(100, prev + approvalGained));

      if (currentClosedTasksCount === 0) {
        showStoryMessage("firstTask");
      }

      setIsCompletingTask(false);
      setTaskDetailsForCompletion(null);
    }
    return () => clearTimeout(timerId);
  }, [
    isCompletingTask,
    taskCooldown,
    taskDetailsForCompletion,
    closedTasks,
    showStoryMessage,
    isSceneComplete,
  ]);

  useEffect(() => {
    if (loc >= 100) showStoryMessage("loc100");
  }, [loc, showStoryMessage]);

  useEffect(() => {
    if (purchasedFactoryIds.has("factory-syntax-highlighter")) {
      showStoryMessage("syntaxHighlighterUnlocked");
    }
  }, [purchasedFactoryIds, showStoryMessage]);

  useEffect(() => {
    if (bossApproval >= 50 && bossApproval < 100)
      showStoryMessage("approval50");
  }, [bossApproval, showStoryMessage]);

  useEffect(() => {
    if (bossApproval >= 100 && !isSceneComplete) {
      if (!shownMessages.has("approval100")) {
        showStoryMessage("approval100");
      }
      setIsSceneComplete(true);
    }
  }, [bossApproval, isSceneComplete, showStoryMessage, shownMessages]);
  //endregion

  //region Event Handlers
  const handleWriteCode = () => {
    if (isSceneComplete) return;
    setLoc((prevLoc) => prevLoc + linesPerClick);
  };

  const handleBuyFactory = (factory: Factory) => {
    if (
      isSceneComplete ||
      loc < factory.cost ||
      purchasedFactoryIds.has(factory.id)
    )
      return;
    setLoc((prevLoc) => prevLoc - factory.cost);
    setPurchasedFactoryIds((prev) => new Set(prev).add(factory.id));
    setLocPerSecond((prevLps) => prevLps + factory.lps);
  };

  const handleBuyClickImprovement = (improvement: ClickImprovement) => {
    if (
      isSceneComplete ||
      loc < improvement.cost ||
      purchasedClickImprovementIds.has(improvement.id)
    )
      return;
    setLoc((prevLoc) => prevLoc - improvement.cost);
    setPurchasedClickImprovementIds((prev) =>
      new Set(prev).add(improvement.id)
    );
    setLinesPerClick((prevLpc) => prevLpc + improvement.lpcIncrease);
  };

  const handleCreateTask = () => {
    if (isSceneComplete || isCompletingTask) return;

    const size = parseInt(taskSizeInput, 10);
    if (isNaN(size) || size < 50 || size > 500) {
      alert("Task size must be between 50 and 500 LoC.");
      return;
    }
    if (loc < size) {
      alert("Not enough Lines of Code to create this task.");
      return;
    }

    setLoc((prevLoc) => prevLoc - size);
    setTaskDetailsForCompletion({ size });
    setIsCompletingTask(true);
    setTaskCooldown(10);
  };
  //endregion

  const currentLPS = useMemo(() => locPerSecond.toFixed(1), [locPerSecond]);

  return (
    <SceneWrapper>
      <StickyNote>
        <p>Goal:</p>
        <p>1000 lines by Friday</p>{" "}
        {/* This goal is not currently tracked in logic */}
        <p>& 100% Boss Approval!</p>
      </StickyNote>
      <Header>
        <h1>Chapter 1. Hello World</h1>
        <h2>Scene: The Coding Cubicle</h2>
      </Header>
      <SceneDescription>
        Bob has landed a junior software developer role at a mid-sized tech
        company. The office is quiet except for the clattering of mechanical
        keyboards. Bob's desk is minimal—two monitors, a company-issued laptop,
        and a sticky note with a short-term goal.
      </SceneDescription>

      {storyMessage && !isSceneComplete && (
        <StoryMessageDisplay>{storyMessage}</StoryMessageDisplay>
      )}

      <MainLayout>
        <StatsPanel>
          <PanelTitle>Stats</PanelTitle>
          <StatItem>
            <strong>Lines of Code (LoC):</strong> {loc.toFixed(0)}
          </StatItem>
          <StatItem>
            <strong>Boss Approval:</strong> {bossApproval}%
          </StatItem>
          <StatItem>
            <strong>Closed Tasks:</strong> {closedTasks}
          </StatItem>
          <StatItem>
            <strong>Lines per Click:</strong> {linesPerClick}
          </StatItem>
          <StatItem>
            <strong>LoC per Second:</strong> {currentLPS}
          </StatItem>
        </StatsPanel>

        <ActionsPanel>
          <PanelTitle>Actions</PanelTitle>
          <Button
            onClick={handleWriteCode}
            disabled={isCompletingTask || isSceneComplete}
          >
            Write Code
          </Button>

          <PanelTitle style={{ marginTop: "20px", fontSize: "1.1em" }}>
            Create Task
          </PanelTitle>
          <Input
            type="number"
            value={taskSizeInput}
            onChange={(e) => setTaskSizeInput(e.target.value)}
            min="50"
            max="500"
            step="10"
            disabled={isCompletingTask || isSceneComplete}
          />
          <Button
            onClick={handleCreateTask}
            disabled={
              isCompletingTask ||
              isSceneComplete ||
              loc < Number(taskSizeInput) ||
              Number(taskSizeInput) < 50 ||
              Number(taskSizeInput) > 500
            }
          >
            {isCompletingTask
              ? `Completing Task (${taskCooldown}s)`
              : "Convert to Closed Task"}
          </Button>
          <small
            style={{
              display: "block",
              textAlign: "center",
              marginTop: "5px",
              fontSize: "0.8em",
            }}
          >
            Cost: {taskSizeInput} LoC. Takes 10 seconds.
          </small>
        </ActionsPanel>

        <UpgradesPanel>
          <PanelTitle>Upgrades</PanelTitle>
          <UpgradeCategory>
            <h4>Factories (Automation)</h4>
            {INITIAL_FACTORIES.map((factory) => (
              <UpgradeItem key={factory.id}>
                <strong>{factory.name}</strong> (+{factory.lps}/sec)
                <p>{factory.description}</p>
                <small>Cost: {factory.cost} LoC</small>
                <UpgradeButton
                  onClick={() => handleBuyFactory(factory)}
                  disabled={
                    loc < factory.cost ||
                    purchasedFactoryIds.has(factory.id) ||
                    isSceneComplete
                  }
                  className={
                    purchasedFactoryIds.has(factory.id) ? "purchased" : ""
                  }
                >
                  {purchasedFactoryIds.has(factory.id)
                    ? "Purchased"
                    : `Buy (${factory.cost} LoC)`}
                </UpgradeButton>
              </UpgradeItem>
            ))}
          </UpgradeCategory>
          <UpgradeCategory>
            <h4>Click Improvements</h4>
            {INITIAL_CLICK_IMPROVEMENTS.map((imp) => (
              <UpgradeItem key={imp.id}>
                <strong>{imp.name}</strong>
                <p>{imp.description}</p>
                <small>Cost: {imp.cost} LoC</small>
                <UpgradeButton
                  onClick={() => handleBuyClickImprovement(imp)}
                  disabled={
                    loc < imp.cost ||
                    purchasedClickImprovementIds.has(imp.id) ||
                    isSceneComplete
                  }
                  className={
                    purchasedClickImprovementIds.has(imp.id) ? "purchased" : ""
                  }
                >
                  {purchasedClickImprovementIds.has(imp.id)
                    ? "Purchased"
                    : `Buy (${imp.cost} LoC)`}
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
            <p>{STORY_MESSAGES.sceneEnd}</p>
            <PrimaryActionButton onClick={onComplete}>
              Continue to Next Scene
            </PrimaryActionButton>
          </SceneCompletionMessage>
        </SceneCompletionOverlay>
      )}
    </SceneWrapper>
  );
};

export default Scene01;
