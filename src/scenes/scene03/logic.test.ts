// gameLogic.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  updateGameState,
  TASK_DEFINITIONS,
  type GameState,
  type GameOperation,
  type TaskType,
  type Task,
} from "./logic"; // Adjust path if necessary

// Constants from gameLogic.ts
const INITIAL_BOSS_APPROVAL = 10;
const WORKDAYS_PER_LINE_HUNDREDTHS = 1;
const BOSS_APPROVAL_DECAY_PER_WORKDAY = 1;
const MAX_BOSS_APPROVAL = 100;
const MIN_BOSS_APPROVAL_FOR_GAME_OVER = 0;

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
  CANNOT_CODE_WITHOUT_TASK:
    "You need to select a task before you can write code.",
  CANNOT_SELECT_TASK_IF_ACTIVE:
    "You must complete your current task first before selecting a new one.",
};

const getInitialPlayingState = (): GameState => ({
  linesOfCodeThisTask: 0,
  totalWorkdayHundredths: 0,
  bossApproval: INITIAL_BOSS_APPROVAL,
  currentTask: null,
  messages: [],
  gameStatus: "Playing",
  hasMadeFirstClick: false,
  workdaysFlooredForDecay: 0,
});

describe("updateGameState", () => {
  let initialState: GameState;
  let mathRandomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    initialState = getInitialPlayingState();
    mathRandomSpy = vi.spyOn(Math, "random");
  });

  afterEach(() => {
    mathRandomSpy.mockRestore();
  });

  describe("INITIALIZE_GAME operation", () => {
    it("should correctly initialize the game state", () => {
      const operation: GameOperation = { type: "INITIALIZE_GAME" };
      const newState = updateGameState({} as GameState, operation); // Pass dummy, it's ignored

      expect(newState.linesOfCodeThisTask).toBe(0);
      expect(newState.totalWorkdayHundredths).toBe(0);
      expect(newState.bossApproval).toBe(INITIAL_BOSS_APPROVAL);
      expect(newState.currentTask).toBeNull();
      expect(newState.messages).toEqual([STORY_MESSAGES.SCENE_START]);
      expect(newState.gameStatus).toBe("Playing");
      expect(newState.hasMadeFirstClick).toBe(false);
      expect(newState.workdaysFlooredForDecay).toBe(0);
    });
  });

  describe("SELECT_TASK operation", () => {
    it("should select a task if no task is active", () => {
      const taskType: TaskType = "Small";
      const operation: GameOperation = {
        type: "SELECT_TASK",
        payload: { taskType },
      };
      const newState = updateGameState(initialState, operation);

      expect(newState.currentTask).not.toBeNull();
      expect(newState.currentTask?.type).toBe(taskType);
      expect(newState.currentTask?.name).toBe(TASK_DEFINITIONS[taskType].name);
      expect(newState.currentTask?.targetLines).toBe(
        TASK_DEFINITIONS[taskType].targetLines
      );
      expect(newState.linesOfCodeThisTask).toBe(0);
      expect(newState.messages).toContain(
        STORY_MESSAGES.TASK_ACCEPTED(TASK_DEFINITIONS[taskType].name)
      );
    });

    it("should not select a task if a task is already active and add a message", () => {
      const activeTask: Task = {
        type: "Small", ...TASK_DEFINITIONS.Small,
        successBonus: 0,
        failurePenalty: 0
      };
      initialState.currentTask = activeTask;

      const operation: GameOperation = {
        type: "SELECT_TASK",
        payload: { taskType: "Medium" },
      };
      const newState = updateGameState(initialState, operation);

      expect(newState.currentTask).toEqual(activeTask);
      expect(newState.messages).toContain(
        STORY_MESSAGES.CANNOT_SELECT_TASK_IF_ACTIVE
      );
    });
  });

  describe("CLICK_CODE_BUTTON operation", () => {
    it("should not allow coding if no task is selected and add a message", () => {
      const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
      const newState = updateGameState(initialState, operation);

      expect(newState.linesOfCodeThisTask).toBe(0);
      expect(newState.totalWorkdayHundredths).toBe(0);
      expect(newState.messages).toContain(
        STORY_MESSAGES.CANNOT_CODE_WITHOUT_TASK
      );
    });

    describe("when a task is active", () => {
      // This beforeEach sets up a 'Small' task for most tests in this block
      beforeEach(() => {
        const selectTaskOp: GameOperation = {
          type: "SELECT_TASK",
          payload: { taskType: "Small" },
        };
        initialState = updateGameState(initialState, selectTaskOp);
        initialState.messages = [];
      });

      it("should increment lines of code and workdays", () => {
        const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
        const newState = updateGameState(initialState, operation);

        expect(newState.linesOfCodeThisTask).toBe(1);
        expect(newState.totalWorkdayHundredths).toBe(
          WORKDAYS_PER_LINE_HUNDREDTHS
        );
        expect(newState.bossApproval).toBe(INITIAL_BOSS_APPROVAL);
      });

      it('should add "first click" message only on the very first click', () => {
        const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
        let state = updateGameState(initialState, operation);
        expect(state.messages).toContain(STORY_MESSAGES.FIRST_CLICK);
        expect(state.hasMadeFirstClick).toBe(true);

        state.messages = [];
        state = updateGameState(state, operation);
        expect(state.messages).not.toContain(STORY_MESSAGES.FIRST_CLICK);
      });

      it("should handle boss approval decay correctly per full workday", () => {
        // For this specific test, override the 'Small' task from beforeEach
        // with a 'Large' task to prevent premature completion.
        // Also, reset relevant counters for this isolated test.
        let state: GameState = {
          ...initialState, // Inherits hasMadeFirstClick, etc.
          currentTask: {
            type: "Large",
            ...TASK_DEFINITIONS.Large,
            successBonus: 0,
            failurePenalty: 0,
          },
          linesOfCodeThisTask: 0,
          bossApproval: INITIAL_BOSS_APPROVAL, // Start fresh for this test logic
          totalWorkdayHundredths: 0,
          workdaysFlooredForDecay: 0,
          messages: [], // Clear any messages from initialState setup
        };

        const clicksPerWorkdayCycle = 100 / WORKDAYS_PER_LINE_HUNDREDTHS; // e.g., 100 clicks

        // Phase 1: Click just under one full workday (e.g., 99 clicks)
        for (let i = 0; i < clicksPerWorkdayCycle - 1; i++) {
          state = updateGameState(state, { type: "CLICK_CODE_BUTTON" });
        }
        expect(state.bossApproval).toBe(INITIAL_BOSS_APPROVAL); // No decay yet
        expect(state.workdaysFlooredForDecay).toBe(0);
        expect(state.totalWorkdayHundredths).toBe(
          (clicksPerWorkdayCycle - 1) * WORKDAYS_PER_LINE_HUNDREDTHS
        );

        // Phase 2: Click to complete exactly one full workday (1 more click)
        state = updateGameState(state, { type: "CLICK_CODE_BUTTON" });
        expect(state.bossApproval).toBe(
          INITIAL_BOSS_APPROVAL - BOSS_APPROVAL_DECAY_PER_WORKDAY
        );
        expect(state.workdaysFlooredForDecay).toBe(1);
        expect(state.totalWorkdayHundredths).toBe(
          clicksPerWorkdayCycle * WORKDAYS_PER_LINE_HUNDREDTHS
        );

        // Phase 3: Click just under two full workdays (e.g., another 99 clicks)
        for (let i = 0; i < clicksPerWorkdayCycle - 1; i++) {
          state = updateGameState(state, { type: "CLICK_CODE_BUTTON" });
        }
        // Approval should still be from the first decay, as the second full workday isn't complete
        expect(state.bossApproval).toBe(
          INITIAL_BOSS_APPROVAL - BOSS_APPROVAL_DECAY_PER_WORKDAY
        );
        expect(state.workdaysFlooredForDecay).toBe(1); // Still 1, as 2nd workday not fully passed
        expect(state.totalWorkdayHundredths).toBe(
          (clicksPerWorkdayCycle * 2 - 1) * WORKDAYS_PER_LINE_HUNDREDTHS
        );

        // Phase 4: Click to complete exactly two full workdays (1 more click)
        state = updateGameState(state, { type: "CLICK_CODE_BUTTON" });
        expect(state.bossApproval).toBe(
          INITIAL_BOSS_APPROVAL - BOSS_APPROVAL_DECAY_PER_WORKDAY * 2
        );
        expect(state.workdaysFlooredForDecay).toBe(2);
        expect(state.totalWorkdayHundredths).toBe(
          clicksPerWorkdayCycle * 2 * WORKDAYS_PER_LINE_HUNDREDTHS
        );
      });

      it("should trigger game over if boss approval decays to 0", () => {
        // For this specific test, use a 'Large' task and set approval low.
        let state: GameState = {
          ...initialState, // Inherits hasMadeFirstClick, etc.
          currentTask: {
            type: "Large",
            ...TASK_DEFINITIONS.Large,
            successBonus: 0,
            failurePenalty: 0,
          },
          linesOfCodeThisTask: 0,
          bossApproval: BOSS_APPROVAL_DECAY_PER_WORKDAY, // Approval is exactly what one decay will remove
          totalWorkdayHundredths: 0,
          workdaysFlooredForDecay: 0,
          messages: [],
        };

        const clicksToTriggerOneDecay = 100 / WORKDAYS_PER_LINE_HUNDREDTHS;

        for (let i = 0; i < clicksToTriggerOneDecay; i++) {
          state = updateGameState(state, { type: "CLICK_CODE_BUTTON" });
          // Game over can happen mid-loop, subsequent calls to updateGameState would be no-ops
        }
        expect(state.bossApproval).toBe(MIN_BOSS_APPROVAL_FOR_GAME_OVER);
        expect(state.gameStatus).toBe("Failure");
        // Message check needs to be careful if other messages (like first click) also appear
        expect(state.messages).toContain(STORY_MESSAGES.FAILURE);
      });

      describe("task completion (uses Small task from outer beforeEach)", () => {
        const taskDef = TASK_DEFINITIONS.Small;
        beforeEach(() => {
          // initialState here already has a 'Small' task selected
          initialState.linesOfCodeThisTask = taskDef.targetLines - 1; // one click from completion
          initialState.bossApproval = 50; // Set a mid-range approval for clear delta
          initialState.messages = []; // Clear any prior messages
        });

        it("should handle successful task completion", () => {
          mathRandomSpy.mockReturnValue(taskDef.failureChance + 0.01); // Ensure success

          const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
          const newState = updateGameState(initialState, operation);

          expect(newState.linesOfCodeThisTask).toBe(0);
          expect(newState.currentTask).toBeNull();
          expect(newState.bossApproval).toBe(50 + taskDef.successApprovalBonus);
          expect(newState.messages).toContain(STORY_MESSAGES.TASK_SUCCESS);
          expect(newState.gameStatus).toBe("Playing");
        });

        it("should handle failed task completion", () => {
          mathRandomSpy.mockReturnValue(taskDef.failureChance - 0.01); // Ensure failure

          const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
          const newState = updateGameState(initialState, operation);

          expect(newState.linesOfCodeThisTask).toBe(0);
          expect(newState.currentTask).toBeNull();
          expect(newState.bossApproval).toBe(
            50 + taskDef.failureApprovalPenalty
          );
          expect(newState.messages).toContain(STORY_MESSAGES.TASK_FAILURE);
          expect(newState.gameStatus).toBe("Playing");
        });
      });
    });
  });

  describe("Victory and Failure conditions", () => {
    let taskedState: GameState;

    beforeEach(() => {
      const selectTaskOp: GameOperation = {
        type: "SELECT_TASK",
        payload: { taskType: "Small" },
      };
      taskedState = updateGameState(getInitialPlayingState(), selectTaskOp); // Start with a fresh state + small task
      taskedState.messages = [];
      taskedState.linesOfCodeThisTask = TASK_DEFINITIONS.Small.targetLines - 1;
    });

    it("should set gameStatus to Victory when boss approval reaches 100%", () => {
      taskedState.bossApproval =
        MAX_BOSS_APPROVAL - TASK_DEFINITIONS.Small.successApprovalBonus + 1;
      mathRandomSpy.mockReturnValue(1.0); // Ensure task success

      const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
      const newState = updateGameState(taskedState, operation);

      expect(newState.bossApproval).toBe(MAX_BOSS_APPROVAL);
      expect(newState.gameStatus).toBe("Victory");
      expect(newState.messages).toContain(STORY_MESSAGES.VICTORY);
    });

    it("should set gameStatus to Failure when boss approval reaches 0% from task failure", () => {
      taskedState.bossApproval =
        MIN_BOSS_APPROVAL_FOR_GAME_OVER -
        TASK_DEFINITIONS.Small.failureApprovalPenalty -
        1; // e.g. for Small task (-5 penalty), set to 4, so 4-5 = -1 -> 0
      if (taskedState.bossApproval < 0) taskedState.bossApproval = 0; // ensure it's not negative before penalty. For -(-5) = 5, so bossApproval should be 4.
      // Let's simplify: if penalty is -5, set initial approval to 4. 4 + (-5) = -1, clamped to 0.
      taskedState.bossApproval =
        Math.abs(TASK_DEFINITIONS.Small.failureApprovalPenalty) - 1;

      mathRandomSpy.mockReturnValue(0.0); // Ensure task failure

      const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
      const newState = updateGameState(taskedState, operation);

      expect(newState.bossApproval).toBe(MIN_BOSS_APPROVAL_FOR_GAME_OVER);
      expect(newState.gameStatus).toBe("Failure");
      expect(newState.messages).toContain(STORY_MESSAGES.FAILURE);
    });

    it("should clamp boss approval at MAX_BOSS_APPROVAL", () => {
      taskedState.bossApproval = MAX_BOSS_APPROVAL - 1; // 99%
      mathRandomSpy.mockReturnValue(1.0); // Ensure task success (Small task +10%)

      const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
      const newState = updateGameState(taskedState, operation);

      expect(newState.bossApproval).toBe(MAX_BOSS_APPROVAL);
      expect(newState.gameStatus).toBe("Victory");
    });

    it("should clamp boss approval at MIN_BOSS_APPROVAL_FOR_GAME_OVER (0%)", () => {
      taskedState.bossApproval = 1; // 1%
      // Small task failure is -5%
      mathRandomSpy.mockReturnValue(0.0); // Ensure task failure

      const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
      const newState = updateGameState(taskedState, operation);

      expect(newState.bossApproval).toBe(MIN_BOSS_APPROVAL_FOR_GAME_OVER);
      expect(newState.gameStatus).toBe("Failure");
    });
  });

  describe("Game Over states", () => {
    it("should not change state if gameStatus is Victory", () => {
      initialState.gameStatus = "Victory";
      initialState.bossApproval = MAX_BOSS_APPROVAL;
      const originalStateJson = JSON.stringify(initialState);

      const operation: GameOperation = { type: "CLICK_CODE_BUTTON" };
      const newState = updateGameState(initialState, operation);

      expect(JSON.stringify(newState)).toEqual(originalStateJson);
    });

    it("should not change state if gameStatus is Failure", () => {
      initialState.gameStatus = "Failure";
      initialState.bossApproval = MIN_BOSS_APPROVAL_FOR_GAME_OVER;
      const originalStateJson = JSON.stringify(initialState);

      const operation: GameOperation = {
        type: "SELECT_TASK",
        payload: { taskType: "Small" },
      };
      const newState = updateGameState(initialState, operation);

      expect(JSON.stringify(newState)).toEqual(originalStateJson);
    });
  });
});
