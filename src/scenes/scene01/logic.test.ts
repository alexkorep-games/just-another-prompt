import { describe, it, expect, vi } from "vitest";
import {
  type CodingCubicleState,
  processCodingCubicleScene,
  getInitialCodingCubicleState,
  FACTORY_IDS,
  CLICK_IMPROVEMENT_IDS,
  type FactoryId,
  type ClickImprovementId,
  STORY_EVENT_SCENE_END_TRIGGER, // Assuming this is exported for assertion
} from "./logic"; // Adjust path if necessary

// Helper function to simulate a series of clicks (can be kept outside 'it' blocks or as local functions)
function simulateClicks(
  currentState: CodingCubicleState,
  count: number,
  clicksCounter: { count: number }
): CodingCubicleState {
  let state = currentState;
  for (let i = 0; i < count; i++) {
    state = processCodingCubicleScene(state, { type: "WRITE_CODE" });
    clicksCounter.count++;
  }
  return state;
}

// Helper function to buy an upgrade
function tryBuyUpgrade(
  currentState: CodingCubicleState,
  type: "factory" | "clickImprovement",
  id: FactoryId | ClickImprovementId,
  clicksCounter: { count: number }
): CodingCubicleState {
  const upgrade =
    type === "factory"
      ? currentState.factories[id as FactoryId]
      : currentState.clickImprovements[id as ClickImprovementId];

  if (
    upgrade &&
    !upgrade.purchased &&
    currentState.linesOfCode >= upgrade.cost
  ) {
    clicksCounter.count++; // Count as a user action
    return processCodingCubicleScene(currentState, {
      type: "BUY_UPGRADE",
      upgradeType: type,
      upgradeId: id,
    });
  }
  return currentState;
}

// Helper function to start a task
function tryStartTask(
  currentState: CodingCubicleState,
  loc: 50 | 100 | 250 | 500,
  clicksCounter: { count: number }
): CodingCubicleState {
  if (!currentState.taskInProgress && currentState.linesOfCode >= loc) {
    clicksCounter.count++; // Count as a user action
    return processCodingCubicleScene(currentState, {
      type: "START_CLOSE_TASK",
      locToCommit: loc,
    });
  }
  return currentState;
}

describe("Coding Cubicle Scene Playthrough", () => {
  it("should complete the scene with a defined strategy, tracking time and clicks", () => {
    let currentState: CodingCubicleState = processCodingCubicleScene(
      getInitialCodingCubicleState(),
      { type: "INITIALIZE_SCENE" }
    );
    let totalTimePassedInSeconds = 0;
    const clicksCounter = { count: 0 }; // User-initiated operations

    const TICK_INTERVAL = 1; // Simulate 1 second passing per game "step"
    let iteration = 0;
    const MAX_ITERATIONS = 5000; // Safety break for the test

    while (!currentState.isSceneOver && iteration < MAX_ITERATIONS) {
      iteration++;
      let actionTakenThisLoop = false; // To decide if we need to manually click for LoC

      // Strategy:
      // 1. Complete tasks if one is in progress (by letting time pass)
      // 2. Buy upgrades (prioritize click then factory, cheapest first of type)
      // 3. Start tasks (prioritize largest affordable)
      // 4. If nothing else, click 'Write Code' to gather resources

      if (currentState.taskInProgress) {
        // Task in progress, let time tick handle it primarily
      } else if (
        !currentState.clickImprovements[
          CLICK_IMPROVEMENT_IDS.SYNTAX_HIGHLIGHT_CLICK
        ].purchased &&
        currentState.linesOfCode >=
          currentState.clickImprovements[
            CLICK_IMPROVEMENT_IDS.SYNTAX_HIGHLIGHT_CLICK
          ].cost
      ) {
        currentState = tryBuyUpgrade(
          currentState,
          "clickImprovement",
          CLICK_IMPROVEMENT_IDS.SYNTAX_HIGHLIGHT_CLICK,
          clicksCounter
        );
        actionTakenThisLoop = true;
      } else if (
        !currentState.factories[FACTORY_IDS.TEXT_EDITOR_PLUGIN].purchased &&
        currentState.linesOfCode >=
          currentState.factories[FACTORY_IDS.TEXT_EDITOR_PLUGIN].cost
      ) {
        currentState = tryBuyUpgrade(
          currentState,
          "factory",
          FACTORY_IDS.TEXT_EDITOR_PLUGIN,
          clicksCounter
        );
        actionTakenThisLoop = true;
      } else if (
        !currentState.clickImprovements[
          CLICK_IMPROVEMENT_IDS.CODE_AUTOCOMPLETION_CLICK
        ].purchased &&
        currentState.linesOfCode >=
          currentState.clickImprovements[
            CLICK_IMPROVEMENT_IDS.CODE_AUTOCOMPLETION_CLICK
          ].cost
      ) {
        currentState = tryBuyUpgrade(
          currentState,
          "clickImprovement",
          CLICK_IMPROVEMENT_IDS.CODE_AUTOCOMPLETION_CLICK,
          clicksCounter
        );
        actionTakenThisLoop = true;
      } else if (
        !currentState.factories[FACTORY_IDS.SYNTAX_HIGHLIGHTER].purchased &&
        currentState.linesOfCode >=
          currentState.factories[FACTORY_IDS.SYNTAX_HIGHLIGHTER].cost
      ) {
        currentState = tryBuyUpgrade(
          currentState,
          "factory",
          FACTORY_IDS.SYNTAX_HIGHLIGHTER,
          clicksCounter
        );
        actionTakenThisLoop = true;
      } else if (
        !currentState.clickImprovements[
          CLICK_IMPROVEMENT_IDS.PARAMETER_HINTING_CLICK
        ].purchased &&
        currentState.linesOfCode >=
          currentState.clickImprovements[
            CLICK_IMPROVEMENT_IDS.PARAMETER_HINTING_CLICK
          ].cost
      ) {
        currentState = tryBuyUpgrade(
          currentState,
          "clickImprovement",
          CLICK_IMPROVEMENT_IDS.PARAMETER_HINTING_CLICK,
          clicksCounter
        );
        actionTakenThisLoop = true;
      } else if (
        !currentState.factories[FACTORY_IDS.AUTOCOMPLETE_MODULE].purchased &&
        currentState.linesOfCode >=
          currentState.factories[FACTORY_IDS.AUTOCOMPLETE_MODULE].cost
      ) {
        currentState = tryBuyUpgrade(
          currentState,
          "factory",
          FACTORY_IDS.AUTOCOMPLETE_MODULE,
          clicksCounter
        );
        actionTakenThisLoop = true;
      } else if (
        !currentState.factories[FACTORY_IDS.FUNCTION_PARAMETER_HELPER]
          .purchased &&
        currentState.linesOfCode >=
          currentState.factories[FACTORY_IDS.FUNCTION_PARAMETER_HELPER].cost
      ) {
        currentState = tryBuyUpgrade(
          currentState,
          "factory",
          FACTORY_IDS.FUNCTION_PARAMETER_HELPER,
          clicksCounter
        );
        actionTakenThisLoop = true;
      }
      // Start tasks
      else if (!currentState.taskInProgress) {
        // Only start a task if none is active
        if (currentState.linesOfCode >= 500) {
          currentState = tryStartTask(currentState, 500, clicksCounter);
          actionTakenThisLoop = true;
        } else if (currentState.linesOfCode >= 250) {
          currentState = tryStartTask(currentState, 250, clicksCounter);
          actionTakenThisLoop = true;
        } else if (currentState.linesOfCode >= 100) {
          currentState = tryStartTask(currentState, 100, clicksCounter);
          actionTakenThisLoop = true;
        } else if (currentState.linesOfCode >= 50) {
          currentState = tryStartTask(currentState, 50, clicksCounter);
          actionTakenThisLoop = true;
        }
      }

      // If no specific "buy" or "task start" action was taken,
      // or if LoC is critically low for any next step, perform some clicks.
      // This threshold (e.g., 50 LoC) can be adjusted.
      if (
        !actionTakenThisLoop ||
        (currentState.linesOfCode < 50 && !currentState.taskInProgress)
      ) {
        // Avoid excessive clicking if we are just waiting for a task or passive income
        if (!currentState.taskInProgress || currentState.linesOfCode < 50) {
          currentState = simulateClicks(currentState, 5, clicksCounter);
        }
      }

      // Always Tick Time
      currentState = processCodingCubicleScene(currentState, {
        type: "TIME_TICK",
        deltaTimeInSeconds: TICK_INTERVAL,
      });
      totalTimePassedInSeconds += TICK_INTERVAL;

      // Optional: Log progress if debugging the test itself
      // if (iteration % 20 === 0) {
      //     process.stdout.write(`Iter: ${iteration}, Time: ${totalTimePassedInSeconds}s, LoC: ${currentState.linesOfCode.toFixed(1)}, Approval: ${currentState.bossApproval}%, Clicks: ${clicksCounter.count}\n`);
      // }
    }

    const userClickOperations = clicksCounter.count;

    // --- Assertions ---
    expect(
      currentState.isSceneOver,
      `Scene should be over. Final approval: ${currentState.bossApproval}%`
    ).toBe(true);
    expect(currentState.bossApproval).toBeGreaterThanOrEqual(100);
    expect(currentState.storyMessagesLog).toContain(
      "Bob’s performance review goes surprisingly well. A promotion may be on the horizon."
    );
    expect(
      currentState.triggeredStoryEvents.has(STORY_EVENT_SCENE_END_TRIGGER)
    ).toBe(true); // Assuming STORY_EVENT_SCENE_END_TRIGGER is exported

    // You can add more specific assertions about the final state if needed
    // For example, expect certain upgrades to be purchased
    expect(
      currentState.factories[FACTORY_IDS.TEXT_EDITOR_PLUGIN].purchased
    ).toBe(true);
    expect(
      currentState.clickImprovements[
        CLICK_IMPROVEMENT_IDS.SYNTAX_HIGHLIGHT_CLICK
      ].purchased
    ).toBe(true);

    // Output results for test report (Vitest captures console output if not mocked)
    console.log(`\n--- Coding Cubicle Scene Test (Vitest) ---`);
    console.log(`Scene completed in ${totalTimePassedInSeconds} game seconds.`);
    console.log(`Total user click operations: ${userClickOperations}.`);
    console.log(`Iterations to complete: ${iteration}.`);
    if (iteration >= MAX_ITERATIONS) {
      console.warn(
        "MAX_ITERATIONS was reached, the strategy might be suboptimal or there's an issue."
      );
    }

    // Example of a soft performance assertion (adjust numbers based on expected behavior)
    expect(totalTimePassedInSeconds).toBeLessThan(3000); // e.g., expect to finish in under 50 minutes of game time
    expect(userClickOperations).toBeLessThan(1000); // e.g., expect less than 1000 user clicks
  });
});
