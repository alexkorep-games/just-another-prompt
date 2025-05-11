import { describe, it, expect, beforeEach } from "vitest";
import {
  updateGameState,
  getInitialGameState,
  type GameState,
  type ClickUpgradeName,
  type AutomationUpgradeName,
  type TaskSizeKey,
  CLICK_UPGRADE_CONFIG,
  AUTOMATION_UPGRADE_CONFIG,
  TASK_SIZES,
} from "./logic";

// Helper function to apply multiple WRITE_CODE operations
function applyClicks(initialState: GameState, numClicks: number): GameState {
  let s = initialState;
  for (let i = 0; i < numClicks; i++) {
    s = updateGameState(s, { type: "WRITE_CODE" });
  }
  return s;
}

describe("updateGameState", () => {
  let state: GameState;

  beforeEach(() => {
    state = getInitialGameState();
  });

  describe("Initial State", () => {
    it("should have correct default values", () => {
      expect(state.linesOfCode).toBe(0);
      expect(state.bossApproval).toBe(0);
      expect(state.fatigue).toBe(0);
      expect(state.workMode).toBe("Delivery"); // Default
      expect(state.storyMessages).toEqual([
        "Bob takes his first job as a junior developer.",
      ]);
      expect(state.sceneCompleted).toBe(false);
    });
  });

  describe("WRITE_CODE Operation", () => {
    it("should generate 1 LoC per click by default in Delivery mode", () => {
      // Delivery mode: -25% LoC generation. Base 1 LoC/click * 0.75 = 0.75
      const nextState = updateGameState(state, { type: "WRITE_CODE" });
      expect(nextState.linesOfCode).toBe(1 * 0.75);
    });

    it("should generate 1.5 LoC per click in Focus mode", () => {
      state.workMode = "Focus";
      const nextState = updateGameState(state, { type: "WRITE_CODE" });
      // Focus mode: +50% LoC generation. Base 1 LoC/click * 1.5 = 1.5
      expect(nextState.linesOfCode).toBe(1 * 1.5);
    });

    it("should increase fatigue by 1 after 10 clicks", () => {
      const nextState = applyClicks(state, 10);
      expect(nextState.fatigue).toBe(1);
      expect(nextState._clicksSinceLastFatigueIncrease).toBe(0);
    });

    it("should reduce LoC/click by 50% when fatigue > 10", () => {
      state.fatigue = 11; // Set fatigue above threshold
      state.workMode = "Focus"; // Base LoC/click for Focus mode is 1.5
      // Expected: 1.5 (Focus) * 0.5 (Fatigue Penalty) = 0.75
      const nextState = updateGameState(state, { type: "WRITE_CODE" });
      expect(nextState.linesOfCode).toBe(0.75);
    });

    it("should accumulate LoC", () => {
      state = updateGameState(state, { type: "WRITE_CODE" }); // 0.75 LoC
      state = updateGameState(state, { type: "WRITE_CODE" }); // 0.75 LoC
      expect(state.linesOfCode).toBe(1.5);
    });
  });

  describe("BUY_CLICK_UPGRADE Operation", () => {
    const upgradeName: ClickUpgradeName = "syntaxHighlight";
    const upgradeConfig = CLICK_UPGRADE_CONFIG[upgradeName];

    it("should buy an upgrade if enough LoC", () => {
      state.linesOfCode = upgradeConfig.cost;
      const nextState = updateGameState(state, {
        type: "BUY_CLICK_UPGRADE",
        payload: { name: upgradeName },
      });
      expect(nextState.linesOfCode).toBe(0);
      expect(nextState.upgrades.clickUpgrades[upgradeName]).toBe(true);
    });

    it("should not buy an upgrade if not enough LoC", () => {
      state.linesOfCode = upgradeConfig.cost - 1;
      const nextState = updateGameState(state, {
        type: "BUY_CLICK_UPGRADE",
        payload: { name: upgradeName },
      });
      expect(nextState.linesOfCode).toBe(upgradeConfig.cost - 1);
      expect(nextState.upgrades.clickUpgrades[upgradeName]).toBe(false);
    });

    it("should not buy an already owned upgrade", () => {
      state.linesOfCode = upgradeConfig.cost * 2;
      state.upgrades.clickUpgrades[upgradeName] = true;
      const nextState = updateGameState(state, {
        type: "BUY_CLICK_UPGRADE",
        payload: { name: upgradeName },
      });
      expect(nextState.linesOfCode).toBe(upgradeConfig.cost * 2); // No change in LoC
      expect(nextState.upgrades.clickUpgrades[upgradeName]).toBe(true);
    });

    it("buying Syntax Highlight should trigger story message", () => {
      state.linesOfCode = CLICK_UPGRADE_CONFIG.syntaxHighlight.cost;
      const nextState = updateGameState(state, {
        type: "BUY_CLICK_UPGRADE",
        payload: { name: "syntaxHighlight" },
      });
      expect(nextState.storyMessages).toContain("Colors bloom on the screen.");
    });
  });

  describe("BUY_AUTOMATION_UPGRADE Operation", () => {
    const upgradeName: AutomationUpgradeName = "textEditorPlugin";
    const upgradeConfig = AUTOMATION_UPGRADE_CONFIG[upgradeName];

    it("should buy an automation upgrade if enough LoC", () => {
      state.linesOfCode = upgradeConfig.cost;
      const nextState = updateGameState(state, {
        type: "BUY_AUTOMATION_UPGRADE",
        payload: { name: upgradeName },
      });
      expect(nextState.linesOfCode).toBe(0);
      expect(nextState.upgrades.automationUpgrades[upgradeName]).toBe(true);
    });

    it("should not buy an automation upgrade if not enough LoC", () => {
      state.linesOfCode = upgradeConfig.cost - 1;
      const nextState = updateGameState(state, {
        type: "BUY_AUTOMATION_UPGRADE",
        payload: { name: upgradeName },
      });
      expect(nextState.linesOfCode).toBe(upgradeConfig.cost - 1);
      expect(nextState.upgrades.automationUpgrades[upgradeName]).toBe(false);
    });
  });

  describe("COMPLETE_TASK Operation", () => {
    const taskKey: TaskSizeKey = "small";
    const taskInfo = TASK_SIZES[taskKey];

    it("should complete a task if enough LoC and not in Focus mode and no cooldown", () => {
      state.linesOfCode = taskInfo.cost;
      state.workMode = "Delivery";
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey },
      });
      expect(nextState.linesOfCode).toBe(0);
      expect(nextState.bossApproval).toBe(taskInfo.approval);
      expect(nextState.taskCooldownRemainingSeconds).toBe(10);
      expect(nextState.storyMessages).toContain("Boss gives a brief nod.");
    });

    it("should not complete a task if not enough LoC", () => {
      state.linesOfCode = taskInfo.cost - 1;
      state.workMode = "Delivery";
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey },
      });
      expect(nextState.bossApproval).toBe(0);
      expect(nextState.taskCooldownRemainingSeconds).toBe(0);
    });

    it("should not complete a task if in Focus mode", () => {
      state.linesOfCode = taskInfo.cost;
      state.workMode = "Focus";
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey },
      });
      expect(nextState.bossApproval).toBe(0);
    });

    it("should not complete a task if on cooldown", () => {
      state.linesOfCode = taskInfo.cost * 2;
      state.workMode = "Delivery";
      let nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey },
      });
      expect(nextState.bossApproval).toBe(taskInfo.approval);
      // Try to complete again immediately
      nextState = updateGameState(nextState, {
        type: "COMPLETE_TASK",
        payload: { taskKey },
      });
      expect(nextState.bossApproval).toBe(taskInfo.approval); // No change
    });

    it("Function Parameter Helper synergy should increase approval gain", () => {
      state.linesOfCode = taskInfo.cost;
      state.workMode = "Delivery";
      state.upgrades.automationUpgrades.functionParameterHelper = true; // Activate synergy
      const expectedApproval = taskInfo.approval * 1.1; // +10%
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey },
      });
      expect(nextState.bossApproval).toBeCloseTo(expectedApproval);
    });
  });

  describe("TOGGLE_WORK_MODE Operation", () => {
    it("should toggle from Delivery to Focus", () => {
      state.workMode = "Delivery";
      const nextState = updateGameState(state, { type: "TOGGLE_WORK_MODE" });
      expect(nextState.workMode).toBe("Focus");
    });

    it("should toggle from Focus to Delivery", () => {
      state.workMode = "Focus";
      const nextState = updateGameState(state, { type: "TOGGLE_WORK_MODE" });
      expect(nextState.workMode).toBe("Delivery");
    });
  });

  describe("TAKE_BREAK_WITH_LOC Operation", () => {
    it("should reset fatigue if enough LoC and fatigue > 0", () => {
      state.linesOfCode = 50;
      state.fatigue = 5;
      const nextState = updateGameState(state, { type: "TAKE_BREAK_WITH_LOC" });
      expect(nextState.linesOfCode).toBe(0);
      expect(nextState.fatigue).toBe(0);
      expect(nextState._clicksSinceLastFatigueIncrease).toBe(0);
    });

    it("should not reset fatigue if not enough LoC", () => {
      state.linesOfCode = 49;
      state.fatigue = 5;
      const nextState = updateGameState(state, { type: "TAKE_BREAK_WITH_LOC" });
      expect(nextState.linesOfCode).toBe(49);
      expect(nextState.fatigue).toBe(5);
    });

    it("should do nothing if fatigue is 0", () => {
      state.linesOfCode = 50;
      state.fatigue = 0;
      const nextState = updateGameState(state, { type: "TAKE_BREAK_WITH_LOC" });
      expect(nextState.linesOfCode).toBe(50); // No LoC spent
      expect(nextState.fatigue).toBe(0);
    });
  });

  describe("START_WAITING_BREAK Operation", () => {
    it("should start break timer if fatigue > 0 and not already waiting", () => {
      state.fatigue = 1;
      const nextState = updateGameState(state, { type: "START_WAITING_BREAK" });
      expect(nextState.isBreakTimerActive).toBe(true);
      expect(nextState.breakTimerRemainingSeconds).toBe(10);
    });

    it("should not start break timer if fatigue is 0", () => {
      state.fatigue = 0;
      const nextState = updateGameState(state, { type: "START_WAITING_BREAK" });
      expect(nextState.isBreakTimerActive).toBe(false);
    });

    it("should not restart break timer if already active", () => {
      state.fatigue = 1;
      state.isBreakTimerActive = true;
      state.breakTimerRemainingSeconds = 5;
      const nextState = updateGameState(state, { type: "START_WAITING_BREAK" });
      expect(nextState.breakTimerRemainingSeconds).toBe(5);
    });
  });

  describe("TICK Operation", () => {
    it("should generate passive LoC based on automation upgrades and work mode (Delivery)", () => {
      state.linesOfCode = 0;
      state.upgrades.automationUpgrades.textEditorPlugin = true; // 0.5 LoC/s
      state.workMode = "Delivery"; // 0.75 multiplier
      // Expected: 0.5 * 0.75 = 0.375 LoC
      const nextState = updateGameState(state, {
        type: "TICK",
        payload: { deltaTimeInSeconds: 1 },
      });
      expect(nextState.linesOfCode).toBe(0.375);
    });

    it("should generate passive LoC based on automation upgrades and work mode (Focus)", () => {
      state.linesOfCode = 0;
      state.upgrades.automationUpgrades.textEditorPlugin = true; // 0.5 LoC/s
      state.workMode = "Focus"; // 1.5 multiplier
      // Expected: 0.5 * 1.5 = 0.75 LoC
      const nextState = updateGameState(state, {
        type: "TICK",
        payload: { deltaTimeInSeconds: 1 },
      });
      expect(nextState.linesOfCode).toBe(0.75);
    });

    it("should reduce task cooldown", () => {
      state.taskCooldownRemainingSeconds = 5;
      const nextState = updateGameState(state, {
        type: "TICK",
        payload: { deltaTimeInSeconds: 1 },
      });
      expect(nextState.taskCooldownRemainingSeconds).toBe(4);
    });

    it("should reduce break timer and reset fatigue when timer reaches 0", () => {
      state.fatigue = 5;
      state.isBreakTimerActive = true;
      state.breakTimerRemainingSeconds = 1;
      const nextState = updateGameState(state, {
        type: "TICK",
        payload: { deltaTimeInSeconds: 1 },
      });
      expect(nextState.isBreakTimerActive).toBe(false);
      expect(nextState.breakTimerRemainingSeconds).toBe(0);
      expect(nextState.fatigue).toBe(0);
      expect(nextState._clicksSinceLastFatigueIncrease).toBe(0);
    });

    it("all click upgrades synergy should boost passive income by 10%", () => {
      state.linesOfCode = 0;
      state.upgrades.automationUpgrades.textEditorPlugin = true; // 0.5 LoC/s
      state.upgrades.clickUpgrades.syntaxHighlight = true;
      state.upgrades.clickUpgrades.codeAutocompletion = true;
      state.upgrades.clickUpgrades.parameterHinting = true;
      state.workMode = "Focus"; // 1.5 multiplier for base generation
      // Expected: (0.5 * 1.10) * 1.5 = 0.825
      const nextState = updateGameState(state, {
        type: "TICK",
        payload: { deltaTimeInSeconds: 1 },
      });
      expect(nextState.linesOfCode).toBeCloseTo(0.825);
    });

    it("Autocomplete Module (Auto) + Parameter Hinting (Click) synergy should boost passive income by 20%", () => {
      state.linesOfCode = 0;
      state.upgrades.automationUpgrades.autocompleteModule = true; // 2.0 LoC/s
      state.upgrades.clickUpgrades.parameterHinting = true;
      state.workMode = "Focus"; // 1.5 multiplier for base generation
      // Expected: (2.0 * 1.20) * 1.5 = 3.6
      const nextState = updateGameState(state, {
        type: "TICK",
        payload: { deltaTimeInSeconds: 1 },
      });
      expect(nextState.linesOfCode).toBeCloseTo(3.6);
    });
  });

  describe("Synergies Affecting LoC/Click", () => {
    it("Syntax Highlight + Code Autocompletion synergy (+20% LoC/click)", () => {
      state.upgrades.clickUpgrades.syntaxHighlight = true; // +1
      state.upgrades.clickUpgrades.codeAutocompletion = true; // +2
      state.workMode = "Focus"; // 1.5x multiplier
      // Base click = 1 + 1 + 2 = 4
      // With synergy = 4 * 1.20 = 4.8
      // With Focus Mode = 4.8 * 1.5 = 7.2
      const nextState = updateGameState(state, { type: "WRITE_CODE" });
      expect(nextState.linesOfCode).toBeCloseTo(7.2);
    });

    it("Syntax Highlighter (Auto) + Syntax Highlight (Click) synergy (+10% LoC/click)", () => {
      state.upgrades.clickUpgrades.syntaxHighlight = true; // +1
      state.upgrades.automationUpgrades.syntaxHighlighterAutomation = true;
      state.workMode = "Focus"; // 1.5x multiplier
      // Base click = 1 + 1 = 2
      // With synergy = 2 * 1.10 = 2.2
      // With Focus Mode = 2.2 * 1.5 = 3.3
      const nextState = updateGameState(state, { type: "WRITE_CODE" });
      expect(nextState.linesOfCode).toBeCloseTo(3.3);
    });
  });

  describe("Story Triggers and Scene Completion", () => {
    it("should trigger 100 LoC message", () => {
      state.linesOfCode = 99;
      state.workMode = "Focus"; // 1.5 LoC/click
      const nextState = updateGameState(state, { type: "WRITE_CODE" }); // Will generate 1.5, total 100.5
      expect(nextState.storyMessages).toContain(
        "Bob’s fingers start to remember the keys."
      );
      expect(nextState._gameEvents.loc100GeneratedNotified).toBe(true);
    });

    it("should trigger 50% approval message", () => {
      state.bossApproval = 49;
      state.linesOfCode = TASK_SIZES.small.cost; // For +1%
      state.workMode = "Delivery";
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey: "small" },
      });
      expect(nextState.bossApproval).toBe(50);
      expect(nextState.storyMessages).toContain(
        "Manager sends a smiling emoji in chat."
      );
      expect(nextState._gameEvents.approval50Notified).toBe(true);
    });

    it("should trigger 75% approval teaser message", () => {
      state.bossApproval = 74;
      state.linesOfCode = TASK_SIZES.small.cost; // For +1%
      state.workMode = "Delivery";
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey: "small" },
      });
      expect(nextState.bossApproval).toBe(75);
      expect(nextState.storyMessages).toContain(
        "Automation might change everything..."
      );
      expect(nextState._gameEvents.approval75Notified).toBe(true);
    });

    it("should complete scene at 100% approval and grant meta bonus", () => {
      state.bossApproval = 99;
      state.linesOfCode = TASK_SIZES.small.cost; // For +1%
      state.workMode = "Delivery";
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey: "small" },
      });

      expect(nextState.bossApproval).toBe(100);
      expect(nextState.sceneCompleted).toBe(true);
      expect(nextState.storyMessages).toContain(
        "Bob is no longer the new guy—he’s our guy now."
      );
      expect(nextState._gameEvents.approval100Notified).toBe(true);

      // End of scene message & meta bonus should also trigger immediately with approval 100%
      expect(nextState.storyMessages).toContain(
        "Bob’s performance review goes surprisingly well."
      );
      expect(nextState._gameEvents.endOfSceneNotified).toBe(true);
      expect(nextState.metaBonusGranted).toBe(true);
    });

    it("should not allow LoC generation via WRITE_CODE after scene completion", () => {
      state.sceneCompleted = true;
      state.linesOfCode = 100;
      const nextState = updateGameState(state, { type: "WRITE_CODE" });
      expect(nextState.linesOfCode).toBe(100); // No change
    });

    it("should not allow passive LoC generation after scene completion", () => {
      state.sceneCompleted = true;
      state.linesOfCode = 100;
      state.upgrades.automationUpgrades.textEditorPlugin = true;
      const nextState = updateGameState(state, {
        type: "TICK",
        payload: { deltaTimeInSeconds: 1 },
      });
      expect(nextState.linesOfCode).toBe(100); // No change
    });

    it("should not allow task completion after scene completion", () => {
      state.sceneCompleted = true;
      state.bossApproval = 100;
      state.linesOfCode = TASK_SIZES.small.cost;
      state.workMode = "Delivery";
      const nextState = updateGameState(state, {
        type: "COMPLETE_TASK",
        payload: { taskKey: "small" },
      });
      expect(nextState.bossApproval).toBe(100); // No change
      expect(nextState.linesOfCode).toBe(TASK_SIZES.small.cost); // No LoC spent
    });
  });

  describe("Purity of State", () => {
    it("should not mutate the original state object", () => {
      const originalState = getInitialGameState();
      const originalStateClone = JSON.parse(JSON.stringify(originalState)); // Deep clone for comparison

      updateGameState(originalState, { type: "WRITE_CODE" });

      // Check if the originalState object passed to the function remains unchanged
      expect(originalState).toEqual(originalStateClone);
    });
  });
});
