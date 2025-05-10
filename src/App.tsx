// src/App.tsx
import React, { useState, useEffect } from "react";
import GlobalMenu from "./components/GlobalMenu"; // Import the new component

// eagerly import all scene modules
const sceneModules = import.meta.glob("./scenes/*.tsx", { eager: true }) as {
  [path: string]: { default: React.FC<{ onComplete: () => void }> };
};
// sort by filename so Scene1 → Scene2 → …
const scenePaths = Object.keys(sceneModules).sort();

function App() {
  const [current, setCurrent] = useState<number>(() => {
    const savedSceneIndexString = window.localStorage.getItem("currentScene");
    const savedSceneIndex = savedSceneIndexString
      ? Number(savedSceneIndexString)
      : 0;

    if (scenePaths.length === 0) {
      return 0;
    }
    return Math.max(0, Math.min(savedSceneIndex, scenePaths.length - 1));
  });

  // whenever current changes, persist it
  useEffect(() => {
    // Only save if there are scenes to prevent saving an invalid index
    if (scenePaths.length > 0) {
      window.localStorage.setItem("currentScene", String(current));
    }
  }, [current]);

  const handleRestart = () => {
    setCurrent(0);
  };

  const handleSceneComplete = () => {
    const nextSceneIndex = current + 1;
    if (nextSceneIndex < scenePaths.length) {
      setCurrent(nextSceneIndex);
    } else {
      alert("Congratulations! You've completed the entire game!");
      setCurrent(0);
    }
  };

  const handleNextScene = () => {
    setCurrent((prevCurrent) =>
      Math.min(prevCurrent + 1, scenePaths.length - 1)
    );
  };

  const handlePrevScene = () => {
    setCurrent((prevCurrent) => Math.max(prevCurrent - 1, 0));
  };

  const isFirstScene = current === 0;
  const isLastScene = current === scenePaths.length - 1;
  const hasScenes = scenePaths.length > 0;

  if (!hasScenes) {
    return (
      <>
        <GlobalMenu
          onRestart={handleRestart}
          onNextScene={handleNextScene} // Still pass them, they'll be disabled
          onPrevScene={handlePrevScene}
          isFirstScene={true}
          isLastScene={true}
          hasScenes={false}
        />
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            fontFamily: '"Segoe UI", sans-serif',
          }}
        >
          <h1>Game Error</h1>
          <p>
            No scenes found. Please add scene files to the 'src/scenes'
            directory.
          </p>
        </div>
      </>
    );
  }

  const SceneComponent = sceneModules[scenePaths[current]].default;

  return (
    <>
      <GlobalMenu
        onRestart={handleRestart}
        onNextScene={handleNextScene}
        onPrevScene={handlePrevScene}
        isFirstScene={isFirstScene}
        isLastScene={isLastScene}
        hasScenes={true}
      />
      <SceneComponent onComplete={handleSceneComplete} />
    </>
  );
}

export default App;
