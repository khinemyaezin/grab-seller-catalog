export type WorkflowStepStatus = "skipped" | "ok" | "failed";
export type WorkflowFailurePolicy = "abort" | "stop" | "continue";
export type WorkflowChainStatus = "completed" | "stopped" | "aborted";
export type WorkflowSyncStatus = "skipped" | "synced" | "failed";

export type WorkflowStepResult<TCtx extends object = object> = {
  status: WorkflowStepStatus;
  error?: Error;
  patch?: Partial<TCtx>;
};

export type WorkflowStep<TCtx extends object> = {
  id: string;
  run: (ctx: TCtx) => Promise<WorkflowStepResult<TCtx>>;
  onFailure?: WorkflowFailurePolicy | ((ctx: TCtx) => WorkflowFailurePolicy);
};

export type WorkflowChainResult<TCtx extends object> = {
  status: WorkflowChainStatus;
  ctx: TCtx;
  steps: Record<string, WorkflowStepResult<TCtx>>;
  failedStepId?: string;
  error?: Error;
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function storedResult<TCtx extends object>(
  result: WorkflowStepResult<TCtx>,
): WorkflowStepResult<TCtx> {
  return result.error
    ? { status: result.status, error: result.error }
    : { status: result.status };
}

function resolvePolicy<TCtx extends object>(
  step: WorkflowStep<TCtx>,
  ctx: TCtx,
): WorkflowFailurePolicy {
  const policy = step.onFailure ?? "abort";
  return typeof policy === "function" ? policy(ctx) : policy;
}

export function toWorkflowStepResult<TCtx extends object = object>(result: {
  status: WorkflowSyncStatus;
  error?: Error;
}): WorkflowStepResult<TCtx> {
  if (result.status === "failed") {
    return { status: "failed", error: result.error ?? new Error("Step failed") };
  }
  return { status: result.status === "skipped" ? "skipped" : "ok" };
}

export function isWorkflowChainIdle<TCtx extends object>(
  result: WorkflowChainResult<TCtx>,
): boolean {
  const steps = Object.values(result.steps);
  return steps.length > 0 && steps.every((step) => step.status === "skipped");
}

export async function runWorkflowChain<TCtx extends object>(
  steps: WorkflowStep<TCtx>[],
  initialCtx: TCtx,
): Promise<WorkflowChainResult<TCtx>> {
  let ctx = { ...initialCtx };
  const results: Record<string, WorkflowStepResult<TCtx>> = {};
  let failedStepId: string | undefined;
  let error: Error | undefined;
  let status: WorkflowChainStatus = "completed";

  for (const step of steps) {
    let result: WorkflowStepResult<TCtx>;
    try {
      result = await step.run(ctx);
    } catch (thrown) {
      result = { status: "failed", error: toError(thrown) };
    }

    results[step.id] = storedResult(result);

    if (result.status === "ok" && result.patch) {
      ctx = { ...ctx, ...result.patch };
    }

    if (result.status !== "failed") {
      continue;
    }

    const failureError = result.error ?? new Error(`Step "${step.id}" failed`);
    if (!failedStepId) {
      failedStepId = step.id;
      error = failureError;
    }

    const policy = resolvePolicy(step, ctx);
    if (policy === "continue") {
      continue;
    }

    status = policy === "stop" ? "stopped" : "aborted";
    break;
  }

  return {
    status,
    ctx,
    steps: results,
    ...(failedStepId ? { failedStepId, error } : {}),
  };
}
