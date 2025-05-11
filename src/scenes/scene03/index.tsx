import React, { useState, useEffect, useCallback, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import {
  updateGameState,
  type GameState,
  TASK_DEFINITIONS,
  type TaskType,
} from "./logic"; // Ensure this path is correct

// --- Styled Components ---

const SceneWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
  box-sizing: border-box;
  background: #f4f7f6; // Light grey-ish background
  font-family: "Arial", sans-serif;
  color: #333;

  @media (min-width: 768px) {
    padding: 40px;
  }
`;

const Header = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: #2c3e50; // Dark blue
  text-align: center;

  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 30px;
  }
`;

const GameArea = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px; // Mobile first, constrained width
  gap: 20px; // Spacing between sections

  @media (min-width: 768px) {
    max-width: 700px;
    gap: 25px;
  }
`;

const Panel = styled.div`
  background: #ffffff;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 20px;
  }
`;

const ResourcePanel = styled(Panel)`
  display: flex;
  flex-direction: column; // Stack resources vertically on mobile
  gap: 15px;

  @media (min-width: 480px) {
    // Switch to row for slightly larger screens
    flex-direction: row;
    justify-content: space-around;
    flex-wrap: wrap;
  }
`;

const ResourceIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-grow: 1; // Allow indicators to grow in a row
`;

const ResourceLabel = styled.span`
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
`;

const ResourceValue = styled.span`
  font-size: 1.4rem;
  font-weight: bold;
  color: #3498db; // Blue for values
`;

const BossApprovalBarWrapper = styled.div`
  width: 100%;
  background-color: #e0e0e0;
  border-radius: 4px;
  height: 10px; // Slimmer bar
  margin-top: 5px;
  overflow: hidden;
`;

interface BossApprovalBarFillProps {
  percentage: number;
  barColor: string;
}

const BossApprovalBarFill = styled.div<BossApprovalBarFillProps>`
  width: ${(props) => props.percentage}%;
  height: 100%;
  background-color: ${(props) => props.barColor};
  transition: width 0.3s ease-in-out, background-color 0.3s ease-in-out;
  border-radius: 4px;
`;

const TaskSection = styled(Panel)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
`;

const TaskSelector = styled.div`
  display: flex;
  flex-direction: column; // Stack task buttons on mobile
  gap: 10px;
  width: 100%;

  @media (min-width: 480px) {
    flex-direction: row; // Row for larger screens
    justify-content: center;
  }
`;

const TaskButton = styled.button`
  padding: 12px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  background-color: #3498db; // Primary blue
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.1s ease;
  width: 100%; // Full width on mobile stack

  &:hover:not(:disabled) {
    background-color: #2980b9; // Darker blue
    transform: translateY(-1px);
  }

  &:disabled {
    background-color: #bdc3c7; // Greyed out
    color: #7f8c8d;
    cursor: not-allowed;
  }

  @media (min-width: 480px) {
    width: auto; // Auto width when in a row
    flex-grow: 1;
    max-width: 150px;
  }
`;

const CurrentTaskDisplay = styled.div`
  text-align: center;
  width: 100%;
`;

const TaskName = styled.h3`
  font-size: 1.2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const TaskProgressText = styled.p`
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 10px;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  background-color: #ecf0f1; // Light grey
  border-radius: 6px;
  height: 28px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
`;

interface ProgressBarFillProps {
  progress: number;
}

const ProgressBarFill = styled.div<ProgressBarFillProps>`
  width: ${(props) => props.progress}%;
  height: 100%;
  background-color: #2ecc71; // Green
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.8rem;
  line-height: 28px;
  transition: width 0.25s ease-in-out;
  border-radius: 6px 0 0 6px;
  ${(props) =>
    props.progress === 100 &&
    css`
      border-radius: 6px;
    `}
`;

const ActionButtonPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
`;

const CodeButton = styled.button`
  padding: 18px 35px;
  font-size: 1.3rem;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  background: linear-gradient(145deg, #5cb85c, #4cae4c); // Green gradient
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: background-color 0.2s ease, transform 0.1s ease,
    box-shadow 0.2s ease;

  &:hover:not(:disabled) {
    background: linear-gradient(145deg, #4cae4c, #449d44);
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }

  &:active:not(:disabled) {
    transform: translateY(0px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    background: #bdc3c7;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

const CodeButtonTooltip = styled.p`
  font-size: 0.8rem;
  color: #7f8c8d; // Muted grey
  margin-top: 8px;
  text-align: center;
`;

const messageAppear = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const MessagePanel = styled(Panel)`
  margin-top: 10px;
  background: #eaf2f8; // Light blue
  padding: 10px;
`;

const Message = styled.p`
  padding: 8px 0;
  color: #2980b9; // Darker blue for text
  font-size: 0.95rem;
  border-bottom: 1px dashed #aed6f1; // Light blue dash
  animation: ${messageAppear} 0.3s ease-out;

  &:last-child {
    border-bottom: none;
  }
`;

const GameOverOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
`;

const GameOverMessage = styled.div`
  background: white;
  padding: 25px 30px;
  border-radius: 10px;
  text-align: center;
  font-size: 1.4rem;
  color: #333;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  max-width: 90%;

  @media (min-width: 768px) {
    font-size: 1.8rem;
    padding: 40px 50px;
  }
`;

interface StrongTextProps {
  type?: "victory" | "failure";
}

const StrongText = styled.strong<StrongTextProps>`
  color: #e74c3c; // Red for failure
  ${(props) =>
    props.type === "victory" &&
    css`
      color: #2ecc71; // Green for victory
    `}
`;

// --- React Component ---

interface Scene03Props {
  onComplete: () => void;
}

const Scene03: React.FC<Scene03Props> = ({ onComplete }) => {
  const [gameState, setGameState] = useState<GameState>(() =>
    updateGameState({} as GameState, { type: "INITIALIZE_GAME" })
  );

  const {
    linesOfCodeThisTask,
    totalWorkdayHundredths,
    bossApproval,
    currentTask,
    messages,
    gameStatus,
  } = gameState;

  useEffect(() => {
    if (gameStatus === "Victory" || gameStatus === "Failure") {
      const timer = setTimeout(() => {
        onComplete();
      }, 3500); // Give user time to read final message
      return () => clearTimeout(timer);
    }
  }, [gameStatus, onComplete]);

  const handleCodeButtonClick = useCallback(() => {
    if (gameStatus !== "Playing") return;
    setGameState((prevState) =>
      updateGameState(prevState, { type: "CLICK_CODE_BUTTON" })
    );
  }, [gameStatus]);

  const handleSelectTask = useCallback(
    (taskType: TaskType) => {
      if (gameStatus !== "Playing") return;
      setGameState((prevState) =>
        updateGameState(prevState, {
          type: "SELECT_TASK",
          payload: { taskType },
        })
      );
    },
    [gameStatus]
  );

  const workdays = useMemo(
    () => (totalWorkdayHundredths / 100).toFixed(2),
    [totalWorkdayHundredths]
  );

  const progressPercent = useMemo(() => {
    if (currentTask && currentTask.targetLines > 0) {
      return Math.min(
        (linesOfCodeThisTask / currentTask.targetLines) * 100,
        100
      );
    }
    return 0;
  }, [linesOfCodeThisTask, currentTask]);

  const getBossApprovalColor = (approval: number): string => {
    if (approval <= 30) return "#e74c3c"; // Red
    if (approval <= 60) return "#f39c12"; // Orange
    return "#2ecc71"; // Green
  };

  const isGameActive = gameStatus === "Playing";

  return (
    <SceneWrapper>
      <Header>Scene 1: Bob Writes Code</Header>
      <GameArea>
        <ResourcePanel>
          <ResourceIndicator>
            <ResourceLabel>Lines of Code</ResourceLabel>
            <ResourceValue>
              {currentTask ? linesOfCodeThisTask : "N/A"}
            </ResourceValue>
          </ResourceIndicator>
          <ResourceIndicator>
            <ResourceLabel>Workdays Used</ResourceLabel>
            <ResourceValue>{workdays}</ResourceValue>
          </ResourceIndicator>
          <ResourceIndicator style={{ width: "100%", maxWidth: "200px" }}>
            {" "}
            {/* Give more space for approval */}
            <ResourceLabel>Boss Approval</ResourceLabel>
            <ResourceValue
              style={{ color: getBossApprovalColor(bossApproval) }}
            >
              {bossApproval}%
            </ResourceValue>
            <BossApprovalBarWrapper>
              <BossApprovalBarFill
                percentage={bossApproval}
                barColor={getBossApprovalColor(bossApproval)}
              />
            </BossApprovalBarWrapper>
          </ResourceIndicator>
        </ResourcePanel>

        <TaskSection>
          {!currentTask ? (
            <>
              <h2
                style={{
                  fontSize: "1.2rem",
                  margin: "0 0 10px 0",
                  color: "#333",
                }}
              >
                Select a Task:
              </h2>
              <TaskSelector>
                {(Object.keys(TASK_DEFINITIONS) as TaskType[]).map(
                  (taskKey) => (
                    <TaskButton
                      key={taskKey}
                      onClick={() => handleSelectTask(taskKey)}
                      disabled={!isGameActive}
                      title={`Target: ${
                        TASK_DEFINITIONS[taskKey].targetLines
                      } lines. Failure: ${
                        TASK_DEFINITIONS[taskKey].failureChance * 100
                      }%`}
                    >
                      {TASK_DEFINITIONS[taskKey].name}
                    </TaskButton>
                  )
                )}
              </TaskSelector>
            </>
          ) : (
            <CurrentTaskDisplay>
              <TaskName>Current Task: {currentTask.name}</TaskName>
              <TaskProgressText>
                Progress: {linesOfCodeThisTask} / {currentTask.targetLines}{" "}
                lines
              </TaskProgressText>
              <ProgressBarContainer>
                <ProgressBarFill progress={progressPercent}>
                  {progressPercent.toFixed(0)}%
                </ProgressBarFill>
              </ProgressBarContainer>
            </CurrentTaskDisplay>
          )}
        </TaskSection>

        <ActionButtonPanel>
          <CodeButton
            onClick={handleCodeButtonClick}
            disabled={!currentTask || !isGameActive}
            title="Write a line of code (Consumes 0.01 workdays)"
          >
            Write Code
          </CodeButton>
          <CodeButtonTooltip>
            {!currentTask
              ? "Select a task to start coding."
              : "Consumes 0.01 workdays per line."}
          </CodeButtonTooltip>
        </ActionButtonPanel>

        {messages.length > 0 && (
          <MessagePanel>
            {messages.map((msg, index) => (
              <Message key={index}>{msg}</Message>
            ))}
          </MessagePanel>
        )}
      </GameArea>

      {(gameStatus === "Victory" || gameStatus === "Failure") && (
        <GameOverOverlay>
          <GameOverMessage>
            <StrongText type={gameStatus === "Victory" ? "victory" : "failure"}>
              {gameStatus === "Victory" ? "SUCCESS!" : "FAILURE!"}
            </StrongText>
            <p style={{ fontSize: "1rem", marginTop: "10px", color: "#555" }}>
              {messages.length > 0
                ? messages[messages.length - 1]
                : gameStatus === "Victory"
                ? "You impressed the boss!"
                : "Performance review time..."}
            </p>
          </GameOverMessage>
        </GameOverOverlay>
      )}
    </SceneWrapper>
  );
};

export default Scene03;
