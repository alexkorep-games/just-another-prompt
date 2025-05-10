// src/components/GlobalMenu.tsx
import React from "react";
import styled from "styled-components";

const ToolbarContainer = styled.div`
  background-color: #2c3e50; /* Dark blue-grey, matches scene headers */
  color: white;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between; /* Distribute space between items */
  align-items: center;
  position: sticky; /* Sticks to the top on scroll */
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 990; /* Below scene completion overlay (1000), above other content */
  height: 50px; /* Fixed height for the toolbar */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px; /* Space between buttons in a group */
`;

const BaseButton = styled.button`
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: bold;
  transition: background-color 0.2s ease;

  &:disabled {
    background-color: #7f8c8d; /* Muted color for disabled */
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const RestartButton = styled(BaseButton)`
  background-color: #e74c3c; /* Red for restart/warning */
  &:hover:not(:disabled) {
    background-color: #c0392b; /* Darker red on hover */
  }
`;

const DevButton = styled(BaseButton)`
  background-color: #3498db; /* Blue for dev actions */
  &:hover:not(:disabled) {
    background-color: #2980b9; /* Darker blue on hover */
  }
`;

interface GlobalMenuProps {
  onRestart: () => void;
  onNextScene: () => void;
  onPrevScene: () => void;
  isFirstScene: boolean;
  isLastScene: boolean;
  hasScenes: boolean;
}

const GlobalMenu: React.FC<GlobalMenuProps> = ({
  onRestart,
  onNextScene,
  onPrevScene,
  isFirstScene,
  isLastScene,
  hasScenes,
}) => {
  const handleRestartClick = () => {
    if (
      window.confirm(
        "Are you sure you want to restart the game from the beginning? All progress will be lost."
      )
    ) {
      onRestart();
    }
  };

  return (
    <ToolbarContainer>
      <ButtonGroup>
        <DevButton onClick={onPrevScene} disabled={!hasScenes || isFirstScene}>
          Prev Scene
        </DevButton>
        <DevButton onClick={onNextScene} disabled={!hasScenes || isLastScene}>
          Next Scene
        </DevButton>
      </ButtonGroup>
      <RestartButton onClick={handleRestartClick} disabled={!hasScenes}>
        Restart Game
      </RestartButton>
    </ToolbarContainer>
  );
};

export default GlobalMenu;
