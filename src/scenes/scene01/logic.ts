// --- Core Types and Interfaces ---

export interface Factory {
  id: string;
  name: string;
  description: string;
  cost: number;
  locPerSec: number;
  purchased: boolean;
}

export interface ClickImprovement {
  id: string;
  name: string;
  description: string;
  cost: number;
  linesPerClickBonus: number;
  purchased: boolean;
}

export interface TaskInProgress {
  timeRemaining: number; // seconds
  locCommitted: number;
  approvalBonus: number;
}

export const FACTORY_IDS = {
  TEXT_EDITOR_PLUGIN: "textEditorPlugin",
  SYNTAX_HIGHLIGHTER: "syntaxHighlighterFactory", // Renamed to avoid clash with click upgrade name
  AUTOCOMPLETE_MODULE: "autocompleteModule",
  FUNCTION_PARAMETER_HELPER: "functionParameterHelper",
} as const;
export type FactoryId = (typeof FACTORY_IDS)[keyof typeof FACTORY_IDS];

export const CLICK_IMPROVEMENT_IDS = {
  SYNTAX_HIGHLIGHT_CLICK: "syntaxHighlightClick",
  CODE_AUTOCOMPLETION_CLICK: "codeAutocompletionClick",
  PARAMETER_HINTING_CLICK: "parameterHintingClick",
} as const;
export type ClickImprovementId =
  (typeof CLICK_IMPROVEMENT_IDS)[keyof typeof CLICK_IMPROVEMENT_IDS];

export interface CodingCubicleState {
  linesOfCode: number;
  bossApproval: number; // Percentage 0-100
  closedTasks: number;
  linesPerClick: number;

  factories: Record<FactoryId, Factory>;
  clickImprovements: Record<ClickImprovementId, ClickImprovement>;

  taskInProgress: TaskInProgress | null;

  storyMessagesLog: string[]; // A log of all unique story messages triggered, in order
  triggeredStoryEvents: Set<string>; // Internal tracking to ensure messages fire only once

  isSceneOver: boolean;
}

// --- Game Operations ---

export type CodingCubicleOperation =
  | { type: "INITIALIZE_SCENE" }
  | { type: "WRITE_CODE" }
  | {
      type: "BUY_UPGRADE";
      upgradeType: "factory" | "clickImprovement";
      upgradeId: FactoryId | ClickImprovementId;
    }
  | { type: "START_CLOSE_TASK"; locToCommit: number } // locToCommit must be 50, 100, 250, or 500
  | { type: "TIME_TICK"; deltaTimeInSeconds: number };

// --- Configuration Constants ---

const INITIAL_LINES_PER_CLICK = 1;

const FACTORIES_CONFIG: Record<FactoryId, Omit<Factory, "purchased">> = {
  [FACTORY_IDS.TEXT_EDITOR_PLUGIN]: {
    id: FACTORY_IDS.TEXT_EDITOR_PLUGIN,
    name: "Text Editor Plugin",
    cost: 50,
    locPerSec: 0.5,
    description: "A lightweight plugin that remembers your last indent level.",
  },
  [FACTORY_IDS.SYNTAX_HIGHLIGHTER]: {
    id: FACTORY_IDS.SYNTAX_HIGHLIGHTER,
    name: "Syntax Highlighter",
    cost: 100,
    locPerSec: 1,
    description: "Highlights code blocks to improve visibility and speed.",
  },
  [FACTORY_IDS.AUTOCOMPLETE_MODULE]: {
    id: FACTORY_IDS.AUTOCOMPLETE_MODULE,
    name: "Autocomplete Module",
    cost: 250,
    locPerSec: 2,
    description: "Suggests common code completions.",
  },
  [FACTORY_IDS.FUNCTION_PARAMETER_HELPER]: {
    id: FACTORY_IDS.FUNCTION_PARAMETER_HELPER,
    name: "Function Parameter Helper",
    cost: 500,
    locPerSec: 4,
    description: "Shows parameter hints inline as you type.",
  },
};

const CLICK_IMPROVEMENTS_CONFIG: Record<
  ClickImprovementId,
  Omit<ClickImprovement, "purchased">
> = {
  [CLICK_IMPROVEMENT_IDS.SYNTAX_HIGHLIGHT_CLICK]: {
    id: CLICK_IMPROVEMENT_IDS.SYNTAX_HIGHLIGHT_CLICK,
    name: "Syntax Highlight (Click)",
    cost: 25,
    linesPerClickBonus: 1,
    description: "Syntax Highlight (lines per click: +1)",
  },
  [CLICK_IMPROVEMENT_IDS.CODE_AUTOCOMPLETION_CLICK]: {
    id: CLICK_IMPROVEMENT_IDS.CODE_AUTOCOMPLETION_CLICK,
    name: "Code Autocompletion (Click)",
    cost: 75,
    linesPerClickBonus: 2,
    description: "Code Autocompletion (lines per click: +2)",
  },
  [CLICK_IMPROVEMENT_IDS.PARAMETER_HINTING_CLICK]: {
    id: CLICK_IMPROVEMENT_IDS.PARAMETER_HINTING_CLICK,
    name: "Parameter Hinting (Click)",
    cost: 150,
    linesPerClickBonus: 3,
    description: "Parameter Hinting (lines per click: +3)",
  },
};

const TASK_COMPLETION_TIME_SECONDS = 10;
const TASK_APPROVAL_TIERS: Array<{ loc: number; approval: number }> = [
  { loc: 50, approval: 1 },
  { loc: 100, approval: 3 },
  { loc: 250, approval: 7 },
  { loc: 500, approval: 15 },
];

// --- Story Messages Constants ---
const STORY_EVENT_INITIAL = "STORY_INITIAL";
const STORY_EVENT_100_LOC = "STORY_100_LOC";
const STORY_EVENT_FIRST_CLOSED_TASK = "STORY_FIRST_CLOSED_TASK";
const STORY_EVENT_SYNTAX_HIGHLIGHTER_UNLOCKED =
  "STORY_SYNTAX_HIGHLIGHTER_UNLOCKED";
const STORY_EVENT_50_BOSS_APPROVAL = "STORY_50_BOSS_APPROVAL";
const STORY_EVENT_100_BOSS_APPROVAL = "STORY_100_BOSS_APPROVAL"; // "Well done" message
export const STORY_EVENT_SCENE_END_TRIGGER = "STORY_SCENE_END_TRIGGER"; // "Performance review" message

const STORY_MESSAGES_TEXT: Record<string, string> = {
  [STORY_EVENT_INITIAL]:
    "Bob takes his first job as a junior developer. Time to impress the boss.",
  [STORY_EVENT_100_LOC]:
    "Bob’s fingers are starting to remember the keys. Momentum builds.",
  [STORY_EVENT_FIRST_CLOSED_TASK]:
    "Boss gives a brief nod. That felt... validating.",
  [STORY_EVENT_SYNTAX_HIGHLIGHTER_UNLOCKED]:
    "Colors bloom on the screen. Code is now a bit more beautiful.",
  [STORY_EVENT_50_BOSS_APPROVAL]:
    "Your manager sends a smiling emoji in chat. That's rare.",
  [STORY_EVENT_100_BOSS_APPROVAL]:
    "Well done. Bob is no longer the new guy—he's *our* guy now.",
  [STORY_EVENT_SCENE_END_TRIGGER]:
    "Bob’s performance review goes surprisingly well. A promotion may be on the horizon.",
};

// --- Helper Functions ---

export function getInitialCodingCubicleState(): CodingCubicleState {
  const initialFactories: Record<FactoryId, Factory> = {} as Record<
    FactoryId,
    Factory
  >;
  for (const key in FACTORIES_CONFIG) {
    const id = key as FactoryId;
    initialFactories[id] = { ...FACTORIES_CONFIG[id], purchased: false };
  }

  const initialClickImprovements: Record<ClickImprovementId, ClickImprovement> =
    {} as Record<ClickImprovementId, ClickImprovement>;
  for (const key in CLICK_IMPROVEMENTS_CONFIG) {
    const id = key as ClickImprovementId;
    initialClickImprovements[id] = {
      ...CLICK_IMPROVEMENTS_CONFIG[id],
      purchased: false,
    };
  }

  return {
    linesOfCode: 0,
    bossApproval: 0,
    closedTasks: 0,
    linesPerClick: INITIAL_LINES_PER_CLICK,
    factories: initialFactories,
    clickImprovements: initialClickImprovements,
    taskInProgress: null,
    storyMessagesLog: [],
    triggeredStoryEvents: new Set<string>(),
    isSceneOver: false,
  };
}

function getApprovalForLoc(loc: number): number | undefined {
  const tier = TASK_APPROVAL_TIERS.find((t) => t.loc === loc);
  return tier?.approval;
}

/**
 * Checks for and applies any new story events based on the current state.
 * Returns a new state object if story events are triggered or scene status changes.
 * Otherwise, returns the same state object.
 */
function applyStoryEventChecks(
  stateAfterOperation: CodingCubicleState
): CodingCubicleState {
  let currentStoryMessagesLog = stateAfterOperation.storyMessagesLog;
  let currentTriggeredEvents = stateAfterOperation.triggeredStoryEvents;
  let modifiedSinceLastStoryCheck = false;

  const triggerStoryEvent = (eventKey: string) => {
    if (
      !currentTriggeredEvents.has(eventKey) &&
      STORY_MESSAGES_TEXT[eventKey]
    ) {
      // Important: create new arrays/sets for pure function behavior
      currentStoryMessagesLog = [
        ...currentStoryMessagesLog,
        STORY_MESSAGES_TEXT[eventKey],
      ];
      currentTriggeredEvents = new Set(currentTriggeredEvents).add(eventKey);
      modifiedSinceLastStoryCheck = true;
    }
  };

  // Check story event conditions
  if (stateAfterOperation.closedTasks === 1) {
    triggerStoryEvent(STORY_EVENT_FIRST_CLOSED_TASK);
  }
  if (stateAfterOperation.linesOfCode >= 100) {
    triggerStoryEvent(STORY_EVENT_100_LOC);
  }
  // Assuming STORY_EVENT_SYNTAX_HIGHLIGHTER_UNLOCKED refers to the factory
  if (
    stateAfterOperation.factories[FACTORY_IDS.SYNTAX_HIGHLIGHTER]?.purchased
  ) {
    triggerStoryEvent(STORY_EVENT_SYNTAX_HIGHLIGHTER_UNLOCKED);
  }
  if (stateAfterOperation.bossApproval >= 50) {
    triggerStoryEvent(STORY_EVENT_50_BOSS_APPROVAL);
  }

  let newIsSceneOver = stateAfterOperation.isSceneOver;
  if (stateAfterOperation.bossApproval >= 100) {
    triggerStoryEvent(STORY_EVENT_100_BOSS_APPROVAL); // "Well done" message

    // If "Well done" message is now active and scene isn't over yet, trigger scene end
    if (
      currentTriggeredEvents.has(STORY_EVENT_100_BOSS_APPROVAL) &&
      !stateAfterOperation.isSceneOver
    ) {
      triggerStoryEvent(STORY_EVENT_SCENE_END_TRIGGER); // "Performance review" message
      // If scene end message is now active, mark scene as over
      if (currentTriggeredEvents.has(STORY_EVENT_SCENE_END_TRIGGER)) {
        if (!newIsSceneOver) {
          // Ensure we only set 'modified' if it actually changes
          newIsSceneOver = true;
          modifiedSinceLastStoryCheck = true;
        }
      }
    }
  }

  if (modifiedSinceLastStoryCheck) {
    return {
      ...stateAfterOperation,
      storyMessagesLog: currentStoryMessagesLog,
      triggeredStoryEvents: currentTriggeredEvents,
      isSceneOver: newIsSceneOver,
    };
  }
  return stateAfterOperation; // No story-related changes
}

// --- Main Game Logic Function ---

export function processCodingCubicleScene(
  currentState: CodingCubicleState,
  operation: CodingCubicleOperation
): CodingCubicleState {
  let stateAfterOperation: CodingCubicleState;

  if (operation.type === "INITIALIZE_SCENE") {
    let initialState = getInitialCodingCubicleState();
    // Trigger the very first story message
    if (
      STORY_MESSAGES_TEXT[STORY_EVENT_INITIAL] &&
      !initialState.triggeredStoryEvents.has(STORY_EVENT_INITIAL)
    ) {
      initialState = {
        ...initialState,
        storyMessagesLog: [STORY_MESSAGES_TEXT[STORY_EVENT_INITIAL]],
        triggeredStoryEvents: new Set<string>().add(STORY_EVENT_INITIAL),
      };
    }
    // This is the fully formed initial state, no further story checks needed for this op
    return initialState;
  }

  // For most operations, if scene is over, no further state changes (except TIME_TICK for task completion)
  if (currentState.isSceneOver && operation.type !== "TIME_TICK") {
    return currentState;
  }

  switch (operation.type) {
    case "WRITE_CODE": {
      // isSceneOver check already handled above for this operation
      stateAfterOperation = {
        ...currentState,
        linesOfCode: currentState.linesOfCode + currentState.linesPerClick,
      };
      break;
    }

    case "BUY_UPGRADE": {
      const { upgradeType, upgradeId } = operation;
      if (upgradeType === "factory") {
        const factoryToBuy = currentState.factories[upgradeId as FactoryId];
        if (
          factoryToBuy &&
          !factoryToBuy.purchased &&
          currentState.linesOfCode >= factoryToBuy.cost
        ) {
          const newFactories = {
            ...currentState.factories,
            [upgradeId]: { ...factoryToBuy, purchased: true },
          };
          stateAfterOperation = {
            ...currentState,
            linesOfCode: currentState.linesOfCode - factoryToBuy.cost,
            factories: newFactories,
          };
        } else {
          stateAfterOperation = currentState; // Cannot buy or invalid ID
        }
      } else {
        // 'clickImprovement'
        const improvToBuy =
          currentState.clickImprovements[upgradeId as ClickImprovementId];
        if (
          improvToBuy &&
          !improvToBuy.purchased &&
          currentState.linesOfCode >= improvToBuy.cost
        ) {
          const newImprovements = {
            ...currentState.clickImprovements,
            [upgradeId]: { ...improvToBuy, purchased: true },
          };
          stateAfterOperation = {
            ...currentState,
            linesOfCode: currentState.linesOfCode - improvToBuy.cost,
            clickImprovements: newImprovements,
            linesPerClick:
              currentState.linesPerClick + improvToBuy.linesPerClickBonus,
          };
        } else {
          stateAfterOperation = currentState; // Cannot buy or invalid ID
        }
      }
      break;
    }

    case "START_CLOSE_TASK": {
      if (currentState.taskInProgress) {
        // Already a task in progress
        stateAfterOperation = currentState;
        break;
      }
      const locCommitted = operation.locToCommit;
      const approvalBonus = getApprovalForLoc(locCommitted);

      if (
        approvalBonus === undefined ||
        currentState.linesOfCode < locCommitted
      ) {
        stateAfterOperation = currentState; // Invalid task size or not enough LoC
        break;
      }

      stateAfterOperation = {
        ...currentState,
        linesOfCode: currentState.linesOfCode - locCommitted,
        taskInProgress: {
          timeRemaining: TASK_COMPLETION_TIME_SECONDS,
          locCommitted: locCommitted,
          approvalBonus: approvalBonus,
        },
      };
      break;
    }

    case "TIME_TICK": {
      let newLoc = currentState.linesOfCode;

      // LoC generation from factories only if scene is not over
      if (!currentState.isSceneOver) {
        let locFromFactoriesThisTick = 0;
        for (const factoryKey in currentState.factories) {
          const factory = currentState.factories[factoryKey as FactoryId];
          if (factory.purchased) {
            locFromFactoriesThisTick +=
              factory.locPerSec * operation.deltaTimeInSeconds;
          }
        }
        newLoc += locFromFactoriesThisTick;
      }

      let newBossApproval = currentState.bossApproval;
      let newClosedTasks = currentState.closedTasks;
      let newTaskInProgress = currentState.taskInProgress
        ? { ...currentState.taskInProgress }
        : null;

      if (newTaskInProgress) {
        newTaskInProgress.timeRemaining -= operation.deltaTimeInSeconds;
        if (newTaskInProgress.timeRemaining <= 0) {
          newBossApproval = Math.min(
            100,
            currentState.bossApproval + newTaskInProgress.approvalBonus
          );
          newClosedTasks = currentState.closedTasks + 1;
          newTaskInProgress = null; // Task finished
        }
      }

      stateAfterOperation = {
        ...currentState,
        linesOfCode: newLoc,
        bossApproval: newBossApproval,
        closedTasks: newClosedTasks,
        taskInProgress: newTaskInProgress,
      };
      break;
    }
    default:
      // Should be caught by TypeScript if all operation types are handled
      stateAfterOperation = currentState;
      break;
  }

  // After the operation's primary effects, apply story event checks.
  // This ensures story events are based on the *new* state.
  return applyStoryEventChecks(stateAfterOperation);
}
