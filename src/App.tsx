import React, { useState, useEffect } from "react";
import GlobalMenu from "./components/GlobalMenu"; // Assuming you have this component
import Scene1 from "./scenes/scene01";
import Scene2 from "./scenes/scene02";

type SceneComponentType = React.FC<{ onComplete: () => void }>;

const sceneComponents: SceneComponentType[] = [Scene1, Scene2];

function App() {
  const [current, setCurrent] = useState<number>(() => {
    const savedSceneIndexString = window.localStorage.getItem("currentScene");
    const savedSceneIndex = savedSceneIndexString
      ? Number(savedSceneIndexString)
      : 0;

    if (sceneComponents.length === 0) {
      return 0;
    }
    return Math.max(0, Math.min(savedSceneIndex, sceneComponents.length - 1));
  });

  // whenever current changes, persist it
  useEffect(() => {
    // Only save if there are scenes to prevent saving an invalid index
    if (sceneComponents.length > 0) {
      window.localStorage.setItem("currentScene", String(current));
    }
  }, [current]);

  const handleRestart = () => {
    setCurrent(0);
  };

  const handleSceneComplete = () => {
    const nextSceneIndex = current + 1;
    if (nextSceneIndex < sceneComponents.length) {
      setCurrent(nextSceneIndex);
    } else {
      alert("Congratulations! You've completed the entire game!");
      setCurrent(0);
    }
  };

  const handleNextScene = () => {
    setCurrent((prevCurrent) =>
      Math.min(prevCurrent + 1, sceneComponents.length - 1)
    );
  };

  const handlePrevScene = () => {
    setCurrent((prevCurrent) => Math.max(prevCurrent - 1, 0));
  };

  const isFirstScene = current === 0;
  const isLastScene = current === sceneComponents.length - 1;
  const hasScenes = sceneComponents.length > 0;

  if (!hasScenes) {
    return (
      <>
        <GlobalMenu
          onRestart={handleRestart}
          onNextScene={handleNextScene}
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
            No scenes found. Please ensure scenes are imported and added to the
            'sceneComponents' array in App.tsx.
          </p>
        </div>
      </>
    );
  }

  const SceneComponent = sceneComponents[current];

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
