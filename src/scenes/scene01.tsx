import React from "react";
type Scene01Props = {
  onComplete: () => void;
};
const Scene01 = ({ onComplete }: Scene01Props) => {
  return (
    <div>
      <h1>Scene 01</h1>
      <p>This is the first scene.</p>
      <button onClick={onComplete}>Next Scene</button>
    </div>
  );
};
export default Scene01;
