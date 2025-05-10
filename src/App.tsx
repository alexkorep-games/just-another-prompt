// App.tsx
import React, { useState, useEffect } from 'react';

// eagerly import all scene modules
const sceneModules = import.meta.glob('./scenes/*.tsx', { eager: true }) as {
  [path: string]: { default: React.FC<{ onComplete: () => void }> }
};
// sort by filename so Scene1 → Scene2 → …
const scenePaths = Object.keys(sceneModules).sort();

function App() {
  const [current, setCurrent] = useState<number>(Number(window.localStorage.getItem('currentScene')) || 0);

  // on mount, restore last scene index
  useEffect(() => {
    const saved = window.localStorage.getItem('currentScene');
    if (saved) setCurrent(Number(saved));
  }, []);

  // whenever current changes, persist it
  useEffect(() => {
    window.localStorage.setItem('currentScene', String(current));
  }, [current]);

  const Scene = sceneModules[scenePaths[current]].default;

  return <Scene onComplete={() => setCurrent(idx => idx + 1)} />;
}

export default App;
