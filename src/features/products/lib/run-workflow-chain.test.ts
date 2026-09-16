import { describe, expect, it } from "vitest";
import {
  isWorkflowChainIdle,
  runWorkflowChain,
  toWorkflowStepResult,
  type WorkflowStep,
} from "./run-workflow-chain";

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeoutError";
  }
}

type Ctx = {
  productId?: string;
  entityUpdated?: boolean;
  seen?: string[];
};

function record(id: string, status: "skipped" | "ok" | "failed" = "ok") {
  return {
    id,
    run: async (ctx: Ctx) => {
      ctx.seen?.push(id);
      if (status === "failed") {
        return { status, error: new Error(`${id} failed`) };
      }
      return { status };
    },
  } satisfies WorkflowStep<Ctx>;
}

describe("toWorkflowStepResult", () => {
  it("maps synced to ok, skipped to skipped, and failed with a fallback error", () => {
    expect(toWorkflowStepResult({ status: "synced" })).toEqual({ status: "ok" });
    expect(toWorkflowStepResult({ status: "skipped" })).toEqual({ status: "skipped" });
    const error = new Error("boom");
    expect(toWorkflowStepResult({ status: "failed", error })).toEqual({
      status: "failed",
      error,
    });
    expect(toWorkflowStepResult({ status: "failed" }).error?.message).toBe("Step failed");
  });
});

describe("runWorkflowChain", () => {
  it("runs steps in order and treats skipped as success", async () => {
    const seen: string[] = [];
    const result = await runWorkflowChain<Ctx>(
      [
        record("stage"),
        {
          id: "optional",
          run: async (ctx) => {
            ctx.seen?.push("optional");
            return { status: "skipped" };
          },
        },
        record("attach"),
      ],
      { seen },
    );

    expect(seen).toEqual(["stage", "optional", "attach"]);
    expect(result.status).toBe("completed");
    expect(result.steps.optional.status).toBe("skipped");
    expect(result.failedStepId).toBeUndefined();
  });

  it("merges ok patches so later steps see the new context", async () => {
    const result = await runWorkflowChain<Ctx>(
      [
        {
          id: "createEntity",
          run: async () => ({ status: "ok", patch: { productId: "prod-1" } }),
        },
        {
          id: "attachMedia",
          run: async (ctx) => ({
            status: "ok",
            patch: { seen: [ctx.productId ?? ""] },
          }),
        },
      ],
      {},
    );

    expect(result.ctx).toEqual({ productId: "prod-1", seen: ["prod-1"] });
    expect(result.steps.createEntity).toEqual({ status: "ok" });
  });

  it("treats a thrown error as failed and aborts by default", async () => {
    const timeout = new TimeoutError("timed out");
    const seen: string[] = [];
    const result = await runWorkflowChain<Ctx>(
      [
        {
          id: "createEntity",
          run: async () => {
            throw timeout;
          },
        },
        record("attachMedia"),
      ],
      { seen },
    );

    expect(result.status).toBe("aborted");
    expect(result.failedStepId).toBe("createEntity");
    expect(result.error).toBe(timeout);
    expect(seen).toEqual([]);
    expect(result.steps.attachMedia).toBeUndefined();
  });

  it("wraps non-Error throws", async () => {
    const result = await runWorkflowChain<Ctx>(
      [{ id: "stageMedia", run: async () => { throw "nope"; } }],
      {},
    );

    expect(result.status).toBe("aborted");
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe("nope");
  });

  it("stops remaining steps without aborting when onFailure is stop", async () => {
    const seen: string[] = [];
    const result = await runWorkflowChain<Ctx>(
      [
        record("stageMedia", "failed"),
        record("attachMedia"),
      ],
      { seen },
    );

    const withPolicy: WorkflowStep<Ctx>[] = [
      { ...record("stageMedia", "failed"), onFailure: "stop" },
      record("attachMedia"),
    ];
    const stopped = await runWorkflowChain<Ctx>(withPolicy, { seen: [] });

    expect(result.status).toBe("aborted");
    expect(stopped.status).toBe("stopped");
    expect(stopped.failedStepId).toBe("stageMedia");
    expect(stopped.steps.attachMedia).toBeUndefined();
    expect(stopped.error?.message).toBe("stageMedia failed");
  });

  it("continues after failure and keeps the first failed step", async () => {
    const seen: string[] = [];
    const result = await runWorkflowChain<Ctx>(
      [
        { ...record("attachMedia", "failed"), onFailure: "continue" },
        { ...record("attachDescriptions", "failed"), onFailure: "continue" },
      ],
      { seen },
    );

    expect(result.status).toBe("completed");
    expect(seen).toEqual(["attachMedia", "attachDescriptions"]);
    expect(result.failedStepId).toBe("attachMedia");
    expect(result.steps.attachDescriptions.status).toBe("failed");
  });

  it("can continue then abort on a later failure", async () => {
    const seen: string[] = [];
    const result = await runWorkflowChain<Ctx>(
      [
        { ...record("attachMedia", "failed"), onFailure: "continue" },
        record("attachDescriptions", "failed"),
        record("unused"),
      ],
      { seen },
    );

    expect(result.status).toBe("aborted");
    expect(seen).toEqual(["attachMedia", "attachDescriptions"]);
    expect(result.failedStepId).toBe("attachMedia");
    expect(result.steps.unused).toBeUndefined();
  });

  it("resolves onFailure from context after previous patches", async () => {
    const catalogSaved = await runWorkflowChain<Ctx>(
      [
        {
          id: "updateEntity",
          run: async () => ({ status: "ok", patch: { entityUpdated: true } }),
        },
        {
          id: "stageMedia",
          run: async () => ({ status: "failed", error: new Error("upload") }),
          onFailure: (ctx) => (ctx.entityUpdated ? "stop" : "abort"),
        },
        record("attachMedia"),
      ],
      { entityUpdated: false },
    );

    const catalogClean = await runWorkflowChain<Ctx>(
      [
        {
          id: "updateEntity",
          run: async () => ({ status: "skipped" }),
        },
        {
          id: "stageMedia",
          run: async () => ({ status: "failed", error: new Error("upload") }),
          onFailure: (ctx) => (ctx.entityUpdated ? "stop" : "abort"),
        },
      ],
      { entityUpdated: false },
    );

    expect(catalogSaved.status).toBe("stopped");
    expect(catalogSaved.ctx.entityUpdated).toBe(true);
    expect(catalogSaved.steps.attachMedia).toBeUndefined();
    expect(catalogClean.status).toBe("aborted");
  });
});

describe("isWorkflowChainIdle", () => {
  it("is true only when every recorded step was skipped", async () => {
    const idle = await runWorkflowChain<Ctx>(
      [record("updateEntity", "skipped"), record("stageMedia", "skipped")],
      {},
    );
    const busy = await runWorkflowChain<Ctx>(
      [record("updateEntity", "skipped"), record("stageMedia")],
      {},
    );

    expect(isWorkflowChainIdle(idle)).toBe(true);
    expect(isWorkflowChainIdle(busy)).toBe(false);
    expect(isWorkflowChainIdle({ status: "completed", ctx: {}, steps: {} })).toBe(false);
  });
});
