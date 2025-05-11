// Constants for game balance and rules
const CODE_PER_CLICK = 1;
const WORKDAYS_PER_LINE_HUNDREDTHS = 1; // Represents 0.01 workdays
const INITIAL_BOSS_APPROVAL = 10;
const BOSS_APPROVAL_DECAY_PER_WORKDAY = 1;
const MAX_BOSS_APPROVAL = 100;
const MIN_BOSS_APPROVAL_FOR_GAME_OVER = 0; // Boss approval at 0%

// Task definitions
// Using 'as const' allows TypeScript to infer narrower types for task names (TaskType)
// and properties, making it more type-safe.
export const TASK_DEFINITIONS = {
  Small: {
    targetLines: 50,
    failureChance: 0.05, // 5%
    successApprovalBonus: 10,
    failureApprovalPenalty: -5,
    name: "Small Task",
  },
  Medium: {
    targetLines: 300,
    failureChance: 0.2, // 20%
    successApprovalBonus: 25,
    failureApprovalPenalty: -15,
    name: "Medium Task",
  },
  Large: {
    targetLines: 2000,
    failureChance: 0.5, // 50%
    successApprovalBonus: 60,
    failureApprovalPenalty: -40,
    name: "Large Task",
  },
} as const;

/**
 * Represents the type of task, derived from the keys of TASK_DEFINITIONS.
 * e.g., "Small" | "Medium" | "Large"
 */
export type TaskType = keyof typeof TASK_DEFINITIONS;

/**
 * Interface for an active task in the game state.
 */
export interface Task {
  type: TaskType;
  name: string;
  targetLines: number;
  failureChance: number; // Probability from 0 to 1
  successBonus: number; // Positive value for boss approval change
  failurePenalty: number; // Negative value for boss approval change
}

/**
 * Represents the entire state of the game for Scene 1.
 */
export interface GameState {
  linesOfCodeThisTask: number; // Lines of code written for the current task
  totalWorkdayHundredths: number; // Accumulated work time, in hundredths of a workday (integer)
  bossApproval: number; // Boss's approval percentage (0-100)
  currentTask: Task | null; // The currently active task, or null if no task is selected
  messages: string[]; // Array of story/event messages triggered by the last operation
  gameStatus: "Initial" | "Playing" | "Victory" | "Failure"; // Current status of the game scene
  hasMadeFirstClick: boolean; // Flag to track if the first "CLICK_CODE_BUTTON" occurred

  // Tracks the integer part of total workdays (e.g., if totalWorkdays is 2.5, this would be 2)
  // This is used to ensure decay is applied only once per full workday passed.
  workdaysFlooredForDecay: number;
}

/**
 * Represents the set of possible operations that can modify the game state.
 */
export type GameOperation =
  | { type: "INITIALIZE_GAME" }
  | { type: "CLICK_CODE_BUTTON" }
  | { type: "SELECT_TASK"; payload: { taskType: TaskType } };

// Story Messages Constants
const STORY_MESSAGES = {
  SCENE_START:
    "You are Bob, a regular software engineer. A new sprint begins. Write some code.",
  FIRST_CLICK: "One line down. Just a few thousand more to go…",
  TASK_ACCEPTED: (taskName: string) =>
    `Task accepted: ${taskName}. Let’s see if this one impresses the boss.`,
  TASK_SUCCESS: "Task completed! Your boss seems pleased.",
  TASK_FAILURE: "Task failed. That didn't go over well…",
  VICTORY: "Promotion talk is in the air. You’ve impressed the boss!",
  FAILURE:
    "Your boss has called you in. It’s not looking good… Performance Review",
  // Optional messages for invalid actions
  CANNOT_CODE_WITHOUT_TASK:
    "You need to select a task before you can write code.",
  CANNOT_SELECT_TASK_IF_ACTIVE:
    "You must complete your current task first before selecting a new one.",
};

// Helper function to clamp boss approval between MIN_BOSS_APPROVAL_FOR_GAME_OVER and MAX_BOSS_APPROVAL
function clampBossApproval(approval: number): number {
  return Math.max(
    MIN_BOSS_APPROVAL_FOR_GAME_OVER,
    Math.min(approval, MAX_BOSS_APPROVAL)
  );
}

/**
 * Pure function that implements the game logic for "Scene 1: Bob Writes Code".
 * It accepts the current game state and an operation, and returns the new game state.
 * This function does not have side effects.
 *
 * Note: Task resolution involves Math.random(). For strict referential transparency
 * (e.g., for replayability or testing with determined outcomes), a seeded pseudo-random
 * number generator (PRNG) could be passed in or managed as part of the game state.
 * For this implementation, Math.random() is used as is common in game logic.
 */
export function updateGameState(
  currentState: GameState,
  operation: GameOperation
): GameState {
  // INITIALIZE_GAME operation resets the game to its starting state.
  if (operation.type === "INITIALIZE_GAME") {
    return {
      linesOfCodeThisTask: 0,
      totalWorkdayHundredths: 0,
      bossApproval: INITIAL_BOSS_APPROVAL,
      currentTask: null,
      messages: [STORY_MESSAGES.SCENE_START],
      gameStatus: "Playing", // Game starts, ready for Bob to act
      hasMadeFirstClick: false,
      workdaysFlooredForDecay: 0,
    };
  }

  // If the game has reached a Victory or Failure state, no further operations
  // (except potentially a reset, not implemented here) should alter the game mechanics.
  if (
    currentState.gameStatus === "Victory" ||
    currentState.gameStatus === "Failure"
  ) {
    return currentState;
  }

  // Create a new state object based on the current state.
  // Messages are reset for each operation to only show new messages from this operation.
  const newState: GameState = {
    ...currentState,
    messages: [],
  };

  switch (operation.type) {
    case "CLICK_CODE_BUTTON": {
      if (!newState.currentTask) {
        newState.messages.push(STORY_MESSAGES.CANNOT_CODE_WITHOUT_TASK);
        return newState; // Return newState as messages array has been updated
      }

      newState.linesOfCodeThisTask += CODE_PER_CLICK;
      newState.totalWorkdayHundredths += WORKDAYS_PER_LINE_HUNDREDTHS;

      if (!newState.hasMadeFirstClick) {
        newState.messages.push(STORY_MESSAGES.FIRST_CLICK);
        newState.hasMadeFirstClick = true;
      }

      // Apply Boss Approval Decay based on workdays consumed.
      // A "full workday" corresponds to 100 hundredths.
      const currentActualWorkdaysFloored = Math.floor(
        newState.totalWorkdayHundredths / 100
      );
      if (currentActualWorkdaysFloored > newState.workdaysFlooredForDecay) {
        const workdaysPassedSinceLastDecay =
          currentActualWorkdaysFloored - newState.workdaysFlooredForDecay;
        newState.bossApproval -=
          workdaysPassedSinceLastDecay * BOSS_APPROVAL_DECAY_PER_WORKDAY;
        newState.workdaysFlooredForDecay = currentActualWorkdaysFloored;
        newState.bossApproval = clampBossApproval(newState.bossApproval);

        // Check for failure condition immediately after decay.
        if (newState.bossApproval === MIN_BOSS_APPROVAL_FOR_GAME_OVER) {
          newState.gameStatus = "Failure";
          newState.messages.push(STORY_MESSAGES.FAILURE);
          return newState; // Game over (Failure)
        }
      }

      // Check for Task Completion.
      // Ensure currentTask is not null (TypeScript type guard).
      if (
        newState.currentTask &&
        newState.linesOfCodeThisTask >= newState.currentTask.targetLines
      ) {
        const task = newState.currentTask;

        // Determine task success/failure based on failureChance.
        // Math.random() returns a value in [0, 1).
        // Task fails if random number is less than failureChance.
        const isSuccess = Math.random() >= task.failureChance;

        if (isSuccess) {
          newState.bossApproval += task.successBonus;
          newState.messages.push(STORY_MESSAGES.TASK_SUCCESS);
        } else {
          newState.bossApproval += task.failurePenalty; // Penalties are negative values
          newState.messages.push(STORY_MESSAGES.TASK_FAILURE);
        }
        newState.bossApproval = clampBossApproval(newState.bossApproval);

        // Reset task-specific progress.
        newState.currentTask = null;
        newState.linesOfCodeThisTask = 0;

        // Check for victory/failure conditions after task resolution.
        if (newState.bossApproval === MAX_BOSS_APPROVAL) {
          newState.gameStatus = "Victory";
          newState.messages.push(STORY_MESSAGES.VICTORY);
          return newState; // Game over (Victory)
        }
        if (newState.bossApproval === MIN_BOSS_APPROVAL_FOR_GAME_OVER) {
          newState.gameStatus = "Failure";
          newState.messages.push(STORY_MESSAGES.FAILURE);
          return newState; // Game over (Failure)
        }
      }
      break;
    }

    case "SELECT_TASK": {
      if (newState.currentTask) {
        // A task is already active; cannot select another.
        newState.messages.push(STORY_MESSAGES.CANNOT_SELECT_TASK_IF_ACTIVE);
        return newState; // Return newState as messages array has been updated
      }

      const selectedTaskType = operation.payload.taskType;
      const taskTemplate = TASK_DEFINITIONS[selectedTaskType];

      newState.currentTask = {
        type: selectedTaskType, // Store the task's type
        name: taskTemplate.name,
        targetLines: taskTemplate.targetLines,
        failureChance: taskTemplate.failureChance,
        successBonus: taskTemplate.successApprovalBonus,
        failurePenalty: taskTemplate.failureApprovalPenalty,
      };
      newState.linesOfCodeThisTask = 0; // Reset progress for the new task
      newState.messages.push(STORY_MESSAGES.TASK_ACCEPTED(taskTemplate.name));
      break;
    }
  }

  // Final check for game status if not returned earlier from within switch cases.
  // This handles any edge cases or ensures status is correctly set if an operation
  // changed bossApproval without an immediate game over check.
  if (newState.gameStatus === "Playing") {
    if (newState.bossApproval === MAX_BOSS_APPROVAL) {
      newState.gameStatus = "Victory";
      newState.messages.push(STORY_MESSAGES.VICTORY);
    } else if (newState.bossApproval === MIN_BOSS_APPROVAL_FOR_GAME_OVER) {
      newState.gameStatus = "Failure";
      newState.messages.push(STORY_MESSAGES.FAILURE);
    }
  }

  return newState;
}
