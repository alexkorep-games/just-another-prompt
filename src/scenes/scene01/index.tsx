import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  updateGameState,
  getInitialGameState,
  type GameState,
  type Operation,
  type ClickUpgradeName,
  type AutomationUpgradeName,
  type TaskSizeKey,
  CLICK_UPGRADE_CONFIG,
  AUTOMATION_UPGRADE_CONFIG,
  TASK_SIZES,
  calculateLocPerClick,
  calculatePassiveLocPerSecond,
} from "./logic"; // Ensure this path is correct

// --- UI Configuration & Constants ---
const TICK_INTERVAL_MS = 100; // For smoother UI updates & tick processing

// --- Styled Components ---

const pulseAnimation = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 5px rgba(97, 218, 251, 0.3); }
  50% { transform: scale(1.03); box-shadow: 0 0 15px rgba(97, 218, 251, 0.7); }
  100% { transform: scale(1); box-shadow: 0 0 5px rgba(97, 218, 251, 0.3); }
`;

const fadeInAnimation = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  background-color: #282c34; /* Dark background */
  color: #f0f0f0; /* Light text */
  min-height: 100vh;
  padding: 10px;
  box-sizing: border-box;

  @media (min-width: 768px) {
    padding: 20px;
  }
`;

const Header = styled.header`
  width: 100%;
  max-width: 800px;
  text-align: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #1e222a;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const Title = styled.h1`
  font-size: 1.6em;
  color: #61dafb; /* Accent color */
  margin: 0 0 10px 0;
  @media (min-width: 768px) {
    font-size: 2em;
  }
`;

const BossApprovalBarContainer = styled.div`
  width: 100%;
  background-color: #444;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 5px;
  height: 24px; /* Fixed height for the bar */
`;

const BossApprovalBar = styled.div<{ progress: number }>`
  width: ${(props) => props.progress}%;
  background-color: #4caf50; /* Green for progress */
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8em;
  font-weight: bold;
  transition: width 0.3s ease-in-out;
  white-space: nowrap;
`;

const ResourceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  width: 100%;
  max-width: 500px;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #3a3f4a;
  border-radius: 8px;

  span {
    font-size: 0.85em;
    text-align: center;
    padding: 5px;
    background-color: #2c313a;
    border-radius: 4px;
    strong {
      color: #61dafb;
      display: block; /* Make strong take its own line for better readability */
      font-size: 1.1em;
    }
  }
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    font-size: 0.9em;
    max-width: 700px;
  }
`;

const MainActionArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  max-width: 350px;
`;

const Button = styled.button<{
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
}>`
  background-color: ${(props) =>
    props.primary ? "#61dafb" : props.danger ? "#e74c3c" : "#4a5260"};
  color: ${(props) => (props.primary ? "#282c34" : "#f0f0f0")};
  border: none;
  padding: ${(props) => (props.small ? "8px 12px" : "10px 15px")};
  margin: 5px;
  border-radius: 5px;
  font-size: ${(props) => (props.small ? "0.9em" : "1em")};
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  min-width: ${(props) => (props.small ? "100px" : "120px")};
  text-align: center;

  &:hover:not(:disabled) {
    background-color: ${(props) =>
      props.primary ? "#52c5e9" : props.danger ? "#c0392b" : "#5a6270"};
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    background-color: #3a3f4a;
    color: #777;
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (min-width: 768px) {
    padding: ${(props) => (props.small ? "10px 15px" : "12px 20px")};
    font-size: ${(props) => (props.small ? "0.9em" : "1.05em")};
  }
`;

const WriteCodeButton = styled(Button)`
  font-size: 1.1em;
  padding: 12px 20px;
  ${(props) =>
    !props.disabled &&
    css`
      animation: ${pulseAnimation} 2s infinite ease-in-out;
    `}
  margin-bottom: 10px;
  width: 100%;
  max-width: 300px;

  @media (min-width: 768px) {
    font-size: 1.2em;
    padding: 15px 25px;
  }
`;

const FatigueControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 5px;
  font-size: 0.9em;
`;

const Section = styled.section`
  width: 100%;
  max-width: 800px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #3a3f4a;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
`;

const SectionTitle = styled.h2`
  font-size: 1.2em;
  color: #90caf9; /* Lighter blue for section titles */
  margin-top: 0;
  margin-bottom: 10px;
  border-bottom: 1px solid #4a5260;
  padding-bottom: 5px;
  @media (min-width: 768px) {
    font-size: 1.4em;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (min-width: 550px) {
    /* Adjust breakpoint for 2 columns */
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 820px) {
    /* Adjust breakpoint for 3 columns if desired for upgrades */
    /* grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); */
  }
`;

const ItemCard = styled.div`
  background-color: #2c313a;
  padding: 12px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #404552;

  h3 {
    font-size: 1em;
    margin: 0 0 5px 0;
    color: #e0e0e0;
  }
  p {
    margin: 3px 0;
    font-size: 0.8em;
    color: #b0b0b0;
    flex-grow: 1;
  }
  .cost {
    font-weight: bold;
    color: #ffd700; /* Gold for cost */
  }
  .effect {
    color: #81c784; /* Green for positive effect */
  }
`;

const WorkModeToggle = styled.div`
  margin-bottom: 20px;
  text-align: center;
  padding: 10px;
  background-color: #3a3f4a;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;

  p {
    margin-bottom: 8px;
    font-size: 0.95em;
  }
  .description {
    font-size: 0.8em;
    opacity: 0.8;
    margin-top: 5px;
  }
`;

const StoryLogContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin-top: 15px;
  background-color: #2c313a;
  border-radius: 8px;
  padding: 10px 15px;
  max-height: 150px; /* Reduced height */
  overflow-y: auto;
  border: 1px solid #404552;

  p {
    font-size: 0.85em;
    margin: 4px 0;
    color: #b0b0b0;
    animation: ${fadeInAnimation} 0.5s ease-out;
    &:last-child {
      color: #e0e0e0;
      font-weight: bold;
    }
  }
  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #2c313a;
  }
`;

const TeaserText = styled.p`
  font-style: italic;
  color: #61dafb;
  text-align: center;
  margin-top: 10px;
  font-size: 0.85em;
  opacity: 0.7;
`;

const formatNumber = (num: number): string => {
  if (Math.abs(num) < 1 && num !== 0) return num.toFixed(2); // For small fractions like LoC/click
  if (num % 1 !== 0 && Math.abs(num) < 100) return num.toFixed(1); // One decimal for small numbers
  num = Math.round(num * 10) / 10; // Round to one decimal for general use before K/M/B
  if (num < 1000) return num.toString().replace(/\.0$/, "");
  if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  if (num < 1000000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
};

interface Scene01Props {
  onComplete: () => void;
}

const Scene01: React.FC<Scene01Props> = ({ onComplete }) => {
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [lastTickTime, setLastTickTime] = useState<number>(performance.now());

  const dispatch = useCallback((operation: Operation) => {
    setGameState((prevState) => updateGameState(prevState, operation));
  }, []);

  useEffect(() => {
    const gameLoop = () => {
      const now = performance.now();
      const deltaTimeInSeconds = (now - lastTickTime) / 1000;
      setLastTickTime(now);
      dispatch({ type: "TICK", payload: { deltaTimeInSeconds } });
    };

    const intervalId = setInterval(gameLoop, TICK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [dispatch, lastTickTime]);

  useEffect(() => {
    if (gameState.sceneCompleted && !gameState._gameEvents.endOfSceneNotified) {
      // The endOfSceneNotified check ensures onComplete is called only once after all scene end messages
      // Or, more simply, just check sceneCompleted if that's the primary trigger for UI change.
      // For this setup, `onComplete` signifies the player can move on.
      // The "Bob's performance review" message is handled by the logic, so this is fine.
    }
  }, [
    gameState.sceneCompleted,
    gameState._gameEvents.endOfSceneNotified,
    onComplete,
  ]);

  const currentLocPerClick = useMemo(
    () => calculateLocPerClick(gameState),
    [gameState]
  );
  const currentPassiveLocPerSec = useMemo(
    () => calculatePassiveLocPerSecond(gameState),
    [gameState]
  );

  const storyLogRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (storyLogRef.current) {
      storyLogRef.current.scrollTop = 0; // Scroll to top to see newest message
    }
  }, [gameState.storyMessages]);

  if (gameState.sceneCompleted && gameState.metaBonusGranted) {
    // Show completion screen
    return (
      <GameContainer>
        <Header style={{ marginTop: "20vh", backgroundColor: "#4CAF50" }}>
          <Title style={{ color: "white" }}>Scene Completed!</Title>
          <p>Bob's performance review goes surprisingly well.</p>
          <p>
            You earned the "Trusted Developer" badge! (+5% LoC/click in next
            scene)
          </p>
          <Button
            onClick={onComplete}
            primary
            style={{ marginTop: "15px", fontSize: "1.1em" }}
          >
            Continue to The Copilot Era
          </Button>
        </Header>
      </GameContainer>
    );
  }

  return (
    <GameContainer>
      <Header>
        <Title>The Coding Cubicle</Title>
        <BossApprovalBarContainer>
          <BossApprovalBar progress={gameState.bossApproval}>
            {gameState.bossApproval.toFixed(0)}% Approval
          </BossApprovalBar>
        </BossApprovalBarContainer>
        {gameState.bossApproval < 100 &&
          gameState.bossApproval >= 75 &&
          !gameState._gameEvents.approval75Notified && (
            <TeaserText>
              "GitHub Copilot Access: Requires 100% Approval"
            </TeaserText>
          )}
      </Header>

      <ResourceGrid>
        <span>
          LoC: <strong>{formatNumber(gameState.linesOfCode)}</strong>
        </span>
        <span>
          Fatigue: <strong>{gameState.fatigue}</strong>
        </span>
        <span>
          LoC/Click: <strong>{formatNumber(currentLocPerClick)}</strong>
        </span>
        <span>
          LoC/Sec: <strong>{formatNumber(currentPassiveLocPerSec)}</strong>
        </span>
      </ResourceGrid>

      <MainActionArea>
        <WriteCodeButton
          primary
          onClick={() => dispatch({ type: "WRITE_CODE" })}
          disabled={gameState.sceneCompleted}
        >
          Write Code
        </WriteCodeButton>
        <FatigueControls>
          <Button
            small
            onClick={() => dispatch({ type: "TAKE_BREAK_WITH_LOC" })}
            disabled={
              gameState.sceneCompleted ||
              gameState.fatigue === 0 ||
              gameState.linesOfCode < 50
            }
            title="Cost: 50 LoC"
          >
            Break (50 LoC)
          </Button>
          <Button
            small
            onClick={() => dispatch({ type: "START_WAITING_BREAK" })}
            disabled={
              gameState.sceneCompleted ||
              gameState.fatigue === 0 ||
              gameState.isBreakTimerActive
            }
            title={
              gameState.isBreakTimerActive
                ? `Waiting... (${gameState.breakTimerRemainingSeconds.toFixed(
                    0
                  )}s)`
                : "Wait 10s"
            }
          >
            {gameState.isBreakTimerActive
              ? `Resting (${gameState.breakTimerRemainingSeconds.toFixed(0)}s)`
              : "Rest (10s)"}
          </Button>
        </FatigueControls>
      </MainActionArea>

      <WorkModeToggle>
        <p>
          Work Mode: <strong>{gameState.workMode}</strong>
        </p>
        <Button
          onClick={() => dispatch({ type: "TOGGLE_WORK_MODE" })}
          disabled={gameState.sceneCompleted}
        >
          Switch to {gameState.workMode === "Focus" ? "Delivery" : "Focus"}
        </Button>
        <p className="description">
          {gameState.workMode === "Focus"
            ? "Focus: +50% LoC generation, tasks disabled."
            : "Delivery: Tasks enabled, -25% LoC generation."}
        </p>
      </WorkModeToggle>

      <Section>
        <SectionTitle>Click Upgrades</SectionTitle>
        <GridContainer>
          {(Object.keys(CLICK_UPGRADE_CONFIG) as ClickUpgradeName[]).map(
            (name) => {
              const config = CLICK_UPGRADE_CONFIG[name];
              const owned = gameState.upgrades.clickUpgrades[name];
              const canAfford = gameState.linesOfCode >= config.cost;
              return (
                <ItemCard key={name}>
                  <div>
                    <h3>
                      {config.description
                        .split("Adds")[0]
                        .split("Suggests")[0]
                        .trim()}
                    </h3>
                    <p>{config.description}</p>
                    <p className="effect">
                      Effect: +{formatNumber(config.locPerClickBonus)} LoC/click
                    </p>
                    <p className="cost">
                      Cost: {formatNumber(config.cost)} LoC
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      dispatch({ type: "BUY_CLICK_UPGRADE", payload: { name } })
                    }
                    disabled={gameState.sceneCompleted || owned || !canAfford}
                    primary={!owned && canAfford}
                  >
                    {owned ? "Owned" : canAfford ? "Buy" : "Too Costly"}
                  </Button>
                </ItemCard>
              );
            }
          )}
        </GridContainer>
      </Section>

      <Section>
        <SectionTitle>Automation Upgrades</SectionTitle>
        <GridContainer>
          {(
            Object.keys(AUTOMATION_UPGRADE_CONFIG) as AutomationUpgradeName[]
          ).map((name) => {
            const config = AUTOMATION_UPGRADE_CONFIG[name];
            const owned = gameState.upgrades.automationUpgrades[name];
            const canAfford = gameState.linesOfCode >= config.cost;
            // Simple name formatting
            const displayName = name
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())
              .replace("Automation", "")
              .trim();
            return (
              <ItemCard key={name}>
                <div>
                  <h3>{displayName}</h3>
                  <p>{config.description}</p>
                  <p className="effect">
                    Effect: +{formatNumber(config.locPerSecBonus)} LoC/sec
                  </p>
                  <p className="cost">Cost: {formatNumber(config.cost)} LoC</p>
                </div>
                <Button
                  onClick={() =>
                    dispatch({
                      type: "BUY_AUTOMATION_UPGRADE",
                      payload: { name },
                    })
                  }
                  disabled={gameState.sceneCompleted || owned || !canAfford}
                  primary={!owned && canAfford}
                >
                  {owned ? "Owned" : canAfford ? "Buy" : "Too Costly"}
                </Button>
              </ItemCard>
            );
          })}
        </GridContainer>
      </Section>

      <Section>
        <SectionTitle>Close Tasks</SectionTitle>
        <GridContainer>
          {(Object.keys(TASK_SIZES) as TaskSizeKey[]).map((taskKey) => {
            const taskInfo = TASK_SIZES[taskKey];
            const canAfford = gameState.linesOfCode >= taskInfo.cost;
            const isTaskDisabled =
              gameState.workMode === "Focus" ||
              gameState.taskCooldownRemainingSeconds > 0;
            const isDisabled =
              gameState.sceneCompleted || isTaskDisabled || !canAfford;

            let buttonText = `Close (+${taskInfo.approval}% Approval)`;
            if (gameState.workMode === "Focus")
              buttonText = "Requires Delivery Mode";
            else if (gameState.taskCooldownRemainingSeconds > 0)
              buttonText = `Cooldown (${gameState.taskCooldownRemainingSeconds.toFixed(
                0
              )}s)`;
            else if (!canAfford) buttonText = "Not enough LoC";

            return (
              <ItemCard key={taskKey}>
                <div>
                  <h3>
                    Task: {taskKey.charAt(0).toUpperCase() + taskKey.slice(1)}
                  </h3>
                  <p>Spend {formatNumber(taskInfo.cost)} LoC</p>
                  <p className="effect">
                    Gain: +{taskInfo.approval}% Boss Approval
                  </p>
                </div>
                <Button
                  onClick={() =>
                    dispatch({ type: "COMPLETE_TASK", payload: { taskKey } })
                  }
                  disabled={isDisabled}
                  primary={!isTaskDisabled && canAfford}
                >
                  {buttonText}
                </Button>
              </ItemCard>
            );
          })}
        </GridContainer>
        {gameState.taskCooldownRemainingSeconds > 0 &&
          gameState.workMode === "Delivery" && (
            <p
              style={{
                textAlign: "center",
                marginTop: "10px",
                fontSize: "0.9em",
              }}
            >
              Task Cooldown: {gameState.taskCooldownRemainingSeconds.toFixed(1)}
              s
            </p>
          )}
      </Section>

      {gameState.storyMessages.length > 0 && (
        <StoryLogContainer ref={storyLogRef}>
          <SectionTitle
            style={{
              position: "sticky",
              top: 0,
              background: "#2c313a",
              zIndex: 1,
              paddingBottom: "5px",
              marginBottom: "5px",
            }}
          >
            Dev Log
          </SectionTitle>
          {gameState.storyMessages
            .slice()
            .reverse()
            .map((msg, index) => (
              <p key={`${msg}-${index}`}>{msg}</p> // Using index in key because messages can repeat
            ))}
        </StoryLogContainer>
      )}
    </GameContainer>
  );
};

export default Scene01;
