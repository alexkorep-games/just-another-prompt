import React from "react";
type Scene02Props = {
  onComplete: () => void;
};
const Scene02 = ({ onComplete }: Scene02Props) => {
  return (
    <div>
      <h1>Scene 02</h1>
      <p>This is the second scene.</p>
      <button onClick={onComplete}>Next Scene</button>
    </div>
  );
};
export default Scene02;
