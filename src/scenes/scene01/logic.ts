// =====================================================================================
// Game Design Document Interpretation & Constants
// =====================================================================================

// Click Upgrade Names
export type ClickUpgradeName =
  | "syntaxHighlight"
  | "codeAutocompletion"
  | "parameterHinting";

// Automation Upgrade Names
export type AutomationUpgradeName =
  | "textEditorPlugin"
  | "syntaxHighlighterAutomation"
  | "autocompleteModule"
  | "functionParameterHelper";

// Task Sizes and their properties
export interface TaskInfo {
  cost: number;
  approval: number;
}
export const TASK_SIZES: Record<string, TaskInfo> = {
  small: { cost: 50, approval: 1 }, // 50 LoC → +1% Approval
  medium: { cost: 100, approval: 3 }, // 100 LoC → +3% Approval
  large: { cost: 250, approval: 7 }, // 250 LoC → +7% Approval
  xlarge: { cost: 500, approval: 15 }, // 500 LoC → +15% Approval
};
export type TaskSizeKey = keyof typeof TASK_SIZES;

// Click Upgrade Configurations
export const CLICK_UPGRADE_CONFIG: Record<
  ClickUpgradeName,
  { cost: number; locPerClickBonus: number; description: string }
> = {
  syntaxHighlight: {
    cost: 25,
    locPerClickBonus: 1,
    description: "Adds color to code",
  },
  codeAutocompletion: {
    cost: 75,
    locPerClickBonus: 2,
    description: "Suggests common completions",
  },
  parameterHinting: {
    cost: 150,
    locPerClickBonus: 3,
    description: "Adds inline parameter hints",
  },
};

// Automation Upgrade Configurations
export const AUTOMATION_UPGRADE_CONFIG: Record<
  AutomationUpgradeName,
  { cost: number; locPerSecBonus: number; description: string }
> = {
  textEditorPlugin: { cost: 50, locPerSecBonus: 0.5, description: "-" },
  syntaxHighlighterAutomation: {
    cost: 100,
    locPerSecBonus: 1.0,
    description: "+10% LoC/click if Highlight upgrade owned",
  }, // Synergy handled in calc
  autocompleteModule: {
    cost: 250,
    locPerSecBonus: 2.0,
    description: "+20% passive rate if Parameter Hinting owned",
  }, // Synergy handled in calc
  functionParameterHelper: {
    cost: 500,
    locPerSecBonus: 4.0,
    description: "+10% Boss Approval gain from tasks",
  }, // Synergy handled in task completion
};

// Game Mechanic Constants
const BASE_LOC_PER_CLICK = 1;
const FATIGUE_CLICKS_PER_POINT = 10; // 10 manual clicks = +1 Fatigue
const FATIGUE_THRESHOLD_FOR_PENALTY = 10; // Fatigue > 10: LoC/click drops
const FATIGUE_PENALTY_MULTIPLIER = 0.5; // Drops by 50%
const BREAK_BY_LOC_COST = 50;
const BREAK_BY_WAIT_DURATION_SECONDS = 10;
const TASK_COMPLETION_COOLDOWN_SECONDS = 10;

// Work Mode Modifiers
const FOCUS_MODE_LOC_GENERATION_MULTIPLIER = 1.5; // +50%
const DELIVERY_MODE_LOC_GENERATION_MULTIPLIER = 0.75; // -25%

// Synergy Bonus Multipliers
const SYNERGY_CLICK_HIGHLIGHT_AUTOCOMPLETE_MULTIPLIER = 1.2; // Highlight + Autocomplete (Click) → +20% LoC/click
const SYNERGY_ALL_CLICK_UPGRADES_PASSIVE_MULTIPLIER = 1.1; // All click upgrades → +10% passive income
const SYNERGY_AUTO_SYNTAX_CLICK_HIGHLIGHT_CLICK_MULTIPLIER = 1.1; // Syntax Highlighter (Auto) + Highlight (Click) → +10% LoC/click
const SYNERGY_AUTO_MODULE_CLICK_PARAM_HINTING_PASSIVE_MULTIPLIER = 1.2; // Autocomplete Module (Auto) + Param Hinting (Click) → +20% passive
const SYNERGY_AUTO_FUNC_PARAM_HELPER_APPROVAL_MULTIPLIER = 1.1; // Function Param Helper (Auto) → +10% Boss Approval gain

// =====================================================================================
// Game State Definition
// =====================================================================================
export interface GameState {
  linesOfCode: number;
  bossApproval: number; // Range: 0-100
  fatigue: number;
  _clicksSinceLastFatigueIncrease: number; // Internal counter for fatigue system

  workMode: "Focus" | "Delivery";

  upgrades: {
    clickUpgrades: Record<ClickUpgradeName, boolean>;
    automationUpgrades: Record<AutomationUpgradeName, boolean>;
  };

  taskCooldownRemainingSeconds: number;

  isBreakTimerActive: boolean; // For "wait 10s for break"
  breakTimerRemainingSeconds: number;

  storyMessages: string[]; // Log of messages for the player
  _gameEvents: {
    // Flags for one-time story events
    loc100GeneratedNotified: boolean;
    firstTaskCompletedNotified: boolean;
    syntaxHighlighterUnlockedNotified: boolean;
    approval50Notified: boolean;
    approval75Notified: boolean; // Teaser
    approval100Notified: boolean; // Scene completion message
    endOfSceneNotified: boolean; // "performance review" message
  };

  sceneCompleted: boolean;
  metaBonusGranted: boolean; // For "Trusted Developer" badge
}

// =====================================================================================
// Operations Definition
// =====================================================================================
export type Operation =
  | { type: "WRITE_CODE" }
  | { type: "BUY_CLICK_UPGRADE"; payload: { name: ClickUpgradeName } }
  | { type: "BUY_AUTOMATION_UPGRADE"; payload: { name: AutomationUpgradeName } }
  | { type: "COMPLETE_TASK"; payload: { taskKey: TaskSizeKey } }
  | { type: "TOGGLE_WORK_MODE" }
  | { type: "TAKE_BREAK_WITH_LOC" }
  | { type: "START_WAITING_BREAK" }
  | { type: "TICK"; payload: { deltaTimeInSeconds: number } };

// =====================================================================================
// Initial Game State
// =====================================================================================
export function getInitialGameState(): GameState {
  return {
    linesOfCode: 0,
    bossApproval: 0,
    fatigue: 0,
    _clicksSinceLastFatigueIncrease: 0,
    workMode: "Delivery", // Default to Delivery to allow tasks from start
    upgrades: {
      clickUpgrades: {
        syntaxHighlight: false,
        codeAutocompletion: false,
        parameterHinting: false,
      },
      automationUpgrades: {
        textEditorPlugin: false,
        syntaxHighlighterAutomation: false,
        autocompleteModule: false,
        functionParameterHelper: false,
      },
    },
    taskCooldownRemainingSeconds: 0,
    isBreakTimerActive: false,
    breakTimerRemainingSeconds: 0,
    storyMessages: ["Bob takes his first job as a junior developer."],
    _gameEvents: {
      loc100GeneratedNotified: false,
      firstTaskCompletedNotified: false,
      syntaxHighlighterUnlockedNotified: false,
      approval50Notified: false,
      approval75Notified: false,
      approval100Notified: false,
      endOfSceneNotified: false,
    },
    sceneCompleted: false,
    metaBonusGranted: false,
  };
}

// =====================================================================================
// Helper Functions
// =====================================================================================

// Pure deep clone for game state objects.
function deepClone<T>(obj: T): T {
  // Basic deep clone, sufficient for this game state structure.
  // For more complex states with Dates, Maps, Sets, a more robust cloner would be needed.
  return JSON.parse(JSON.stringify(obj));
}

export function calculateLocPerClick(state: Readonly<GameState>): number {
  let loc = BASE_LOC_PER_CLICK;

  if (state.upgrades.clickUpgrades.syntaxHighlight)
    loc += CLICK_UPGRADE_CONFIG.syntaxHighlight.locPerClickBonus;
  if (state.upgrades.clickUpgrades.codeAutocompletion)
    loc += CLICK_UPGRADE_CONFIG.codeAutocompletion.locPerClickBonus;
  if (state.upgrades.clickUpgrades.parameterHinting)
    loc += CLICK_UPGRADE_CONFIG.parameterHinting.locPerClickBonus;

  if (
    state.upgrades.clickUpgrades.syntaxHighlight &&
    state.upgrades.clickUpgrades.codeAutocompletion
  ) {
    loc *= SYNERGY_CLICK_HIGHLIGHT_AUTOCOMPLETE_MULTIPLIER;
  }

  if (
    state.upgrades.automationUpgrades.syntaxHighlighterAutomation &&
    state.upgrades.clickUpgrades.syntaxHighlight
  ) {
    loc *= SYNERGY_AUTO_SYNTAX_CLICK_HIGHLIGHT_CLICK_MULTIPLIER;
  }

  if (state.workMode === "Focus") {
    loc *= FOCUS_MODE_LOC_GENERATION_MULTIPLIER;
  } else if (state.workMode === "Delivery") {
    loc *= DELIVERY_MODE_LOC_GENERATION_MULTIPLIER;
  }

  if (state.fatigue > FATIGUE_THRESHOLD_FOR_PENALTY) {
    loc *= FATIGUE_PENALTY_MULTIPLIER;
  }

  return Math.max(0, loc);
}

export function calculatePassiveLocPerSecond(state: Readonly<GameState>): number {
  let locPerSec = 0;

  if (state.upgrades.automationUpgrades.textEditorPlugin)
    locPerSec += AUTOMATION_UPGRADE_CONFIG.textEditorPlugin.locPerSecBonus;
  if (state.upgrades.automationUpgrades.syntaxHighlighterAutomation)
    locPerSec +=
      AUTOMATION_UPGRADE_CONFIG.syntaxHighlighterAutomation.locPerSecBonus;
  if (state.upgrades.automationUpgrades.autocompleteModule)
    locPerSec += AUTOMATION_UPGRADE_CONFIG.autocompleteModule.locPerSecBonus;
  if (state.upgrades.automationUpgrades.functionParameterHelper)
    locPerSec +=
      AUTOMATION_UPGRADE_CONFIG.functionParameterHelper.locPerSecBonus;

  if (
    state.upgrades.automationUpgrades.autocompleteModule &&
    state.upgrades.clickUpgrades.parameterHinting
  ) {
    locPerSec *= SYNERGY_AUTO_MODULE_CLICK_PARAM_HINTING_PASSIVE_MULTIPLIER;
  }

  if (
    state.upgrades.clickUpgrades.syntaxHighlight &&
    state.upgrades.clickUpgrades.codeAutocompletion &&
    state.upgrades.clickUpgrades.parameterHinting
  ) {
    locPerSec *= SYNERGY_ALL_CLICK_UPGRADES_PASSIVE_MULTIPLIER;
  }

  if (state.workMode === "Focus") {
    locPerSec *= FOCUS_MODE_LOC_GENERATION_MULTIPLIER;
  } else if (state.workMode === "Delivery") {
    locPerSec *= DELIVERY_MODE_LOC_GENERATION_MULTIPLIER;
  }

  return Math.max(0, locPerSec);
}

// This helper mutates the cloned state directly for conciseness within updateGameState.
function _handleStoryAndCompletionTriggers(state: GameState): void {
  if (state.linesOfCode >= 100 && !state._gameEvents.loc100GeneratedNotified) {
    state.storyMessages.push("Bob’s fingers start to remember the keys.");
    state._gameEvents.loc100GeneratedNotified = true;
  }

  if (state.bossApproval >= 50 && !state._gameEvents.approval50Notified) {
    state.storyMessages.push("Manager sends a smiling emoji in chat.");
    state._gameEvents.approval50Notified = true;
  }

  if (state.bossApproval >= 75 && !state._gameEvents.approval75Notified) {
    state.storyMessages.push("Automation might change everything...");
    state._gameEvents.approval75Notified = true;
  }

  if (state.bossApproval >= 100 && !state.sceneCompleted) {
    state.sceneCompleted = true;
    if (!state._gameEvents.approval100Notified) {
      state.storyMessages.push(
        "Bob is no longer the new guy—he’s our guy now."
      );
      state._gameEvents.approval100Notified = true;
    }
  }

  if (state.sceneCompleted && !state._gameEvents.endOfSceneNotified) {
    state.storyMessages.push(
      "Bob’s performance review goes surprisingly well."
    );
    state._gameEvents.endOfSceneNotified = true;
    state.metaBonusGranted = true;
  }
}

// =====================================================================================
// Main Game Logic Function
// =====================================================================================
export function updateGameState(
  currentState: Readonly<GameState>,
  operation: Operation
): GameState {
  const newState: GameState = deepClone(currentState);

  // Scene completion might gate certain actions.
  const sceneIsCompleted = newState.sceneCompleted;

  switch (operation.type) {
    case "WRITE_CODE": {
      if (sceneIsCompleted) break;

      const locGenerated = calculateLocPerClick(newState);
      newState.linesOfCode += locGenerated;

      newState._clicksSinceLastFatigueIncrease++;
      if (
        newState._clicksSinceLastFatigueIncrease >= FATIGUE_CLICKS_PER_POINT
      ) {
        newState.fatigue++;
        newState._clicksSinceLastFatigueIncrease = 0;
      }
      break;
    }

    case "BUY_CLICK_UPGRADE": {
      if (sceneIsCompleted) break;
      const { name } = operation.payload;
      const config = CLICK_UPGRADE_CONFIG[name];
      if (
        !newState.upgrades.clickUpgrades[name] &&
        newState.linesOfCode >= config.cost
      ) {
        newState.linesOfCode -= config.cost;
        newState.upgrades.clickUpgrades[name] = true;

        if (
          name === "syntaxHighlight" &&
          !newState._gameEvents.syntaxHighlighterUnlockedNotified
        ) {
          newState.storyMessages.push("Colors bloom on the screen.");
          newState._gameEvents.syntaxHighlighterUnlockedNotified = true;
        }
      }
      break;
    }

    case "BUY_AUTOMATION_UPGRADE": {
      if (sceneIsCompleted) break;
      const { name } = operation.payload;
      const config = AUTOMATION_UPGRADE_CONFIG[name];
      if (
        !newState.upgrades.automationUpgrades[name] &&
        newState.linesOfCode >= config.cost
      ) {
        newState.linesOfCode -= config.cost;
        newState.upgrades.automationUpgrades[name] = true;
      }
      break;
    }

    case "COMPLETE_TASK": {
      if (sceneIsCompleted) break;
      if (newState.workMode !== "Delivery") break;
      if (newState.taskCooldownRemainingSeconds > 0) break;

      const { taskKey } = operation.payload;
      const taskInfo = TASK_SIZES[taskKey];
      if (newState.linesOfCode >= taskInfo.cost) {
        newState.linesOfCode -= taskInfo.cost;

        let approvalGained = taskInfo.approval;
        if (newState.upgrades.automationUpgrades.functionParameterHelper) {
          approvalGained *= SYNERGY_AUTO_FUNC_PARAM_HELPER_APPROVAL_MULTIPLIER;
        }

        newState.bossApproval += approvalGained;
        newState.taskCooldownRemainingSeconds =
          TASK_COMPLETION_COOLDOWN_SECONDS;

        if (!newState._gameEvents.firstTaskCompletedNotified) {
          newState.storyMessages.push("Boss gives a brief nod.");
          newState._gameEvents.firstTaskCompletedNotified = true;
        }
      }
      break;
    }

    case "TOGGLE_WORK_MODE": {
      // Allow toggle even if scene completed, effect is neutralized by other checks.
      newState.workMode = newState.workMode === "Focus" ? "Delivery" : "Focus";
      break;
    }

    case "TAKE_BREAK_WITH_LOC": {
      if (sceneIsCompleted) break;
      if (newState.linesOfCode >= BREAK_BY_LOC_COST && newState.fatigue > 0) {
        newState.linesOfCode -= BREAK_BY_LOC_COST;
        newState.fatigue = 0;
        newState._clicksSinceLastFatigueIncrease = 0;
        newState.isBreakTimerActive = false;
        newState.breakTimerRemainingSeconds = 0;
      }
      break;
    }

    case "START_WAITING_BREAK": {
      if (sceneIsCompleted) break;
      if (newState.fatigue > 0 && !newState.isBreakTimerActive) {
        newState.isBreakTimerActive = true;
        newState.breakTimerRemainingSeconds = BREAK_BY_WAIT_DURATION_SECONDS;
      }
      break;
    }

    case "TICK": {
      const { deltaTimeInSeconds } = operation.payload;

      if (!sceneIsCompleted) {
        const passiveLoc = calculatePassiveLocPerSecond(newState);
        newState.linesOfCode += passiveLoc * deltaTimeInSeconds;
      }

      if (newState.taskCooldownRemainingSeconds > 0) {
        newState.taskCooldownRemainingSeconds -= deltaTimeInSeconds;
      }

      if (newState.isBreakTimerActive) {
        newState.breakTimerRemainingSeconds -= deltaTimeInSeconds;
        if (newState.breakTimerRemainingSeconds <= 0) {
          newState.fatigue = 0;
          newState._clicksSinceLastFatigueIncrease = 0;
          newState.isBreakTimerActive = false;
          newState.breakTimerRemainingSeconds = 0;
        }
      }
      break;
    }
  }

  // Apply global triggers and ensure values are bounded
  _handleStoryAndCompletionTriggers(newState);

  newState.linesOfCode = Math.max(0, newState.linesOfCode);
  newState.bossApproval = Math.max(0, Math.min(100, newState.bossApproval));
  newState.fatigue = Math.max(0, newState.fatigue);
  newState.taskCooldownRemainingSeconds = Math.max(
    0,
    newState.taskCooldownRemainingSeconds
  );
  newState.breakTimerRemainingSeconds = Math.max(
    0,
    newState.breakTimerRemainingSeconds
  );

  return newState;
}
