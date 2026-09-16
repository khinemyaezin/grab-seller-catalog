import { useCallback, useEffect, useRef } from "react";
import { usePlatform } from "@khinemyaezin/seller-ui";
import type { EventPayloads } from "@khinemyaezin/seller-contracts";
import {
  DEFAULT_WORKFLOW_TIMEOUT_MS,
  TERMINAL_WORKFLOW_STATUSES,
} from "@/features/products/lib/create-sellable-product-workflow";

export type WorkflowUpdatedV1 = EventPayloads["workflow:updated:v1"] & {
  idempotencyKey?: string;
};

export class WorkflowTimeoutError extends Error {
  constructor(message: string = "Workflow timed out") {
    super(message);
    this.name = "WorkflowTimeoutError";
  }
}

export type UseWorkflowAwaiterOptions = {
  workflowName: string;
  timeoutMs?: number;
};

export type WorkflowResponseLike = {
  workflowId?: string;
  status?: string;
  errorMessage?: string | null;
};

export type AwaitWorkflowTrigger<T extends WorkflowResponseLike> = (
  idempotencyKey: string,
) => Promise<T>;

export type AwaitWorkflowResult<T extends WorkflowResponseLike = WorkflowResponseLike> = {
  response?: T;
  event?: WorkflowUpdatedV1;
};

export function useWorkflowAwaiter({
  workflowName,
  timeoutMs = DEFAULT_WORKFLOW_TIMEOUT_MS,
}: UseWorkflowAwaiterOptions) {
  const platform = usePlatform();
  const waiterCancelRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      waiterCancelRef.current?.();
      waiterCancelRef.current = null;
    };
  }, []);

  const awaitWorkflow = useCallback(
    async function awaitWorkflow<T extends WorkflowResponseLike = WorkflowResponseLike>(
      trigger: AwaitWorkflowTrigger<T>,
    ): Promise<AwaitWorkflowResult<T>> {
      const events = platform?.events;
      if (!events) {
        throw new Error("Platform events unavailable");
      }

      const idempotencyKey = crypto.randomUUID();
      let timer: number | undefined;
      let unsubscribe: (() => void) | undefined;
      let matchedEvent: WorkflowUpdatedV1 | null = null;
      let resolveWaiter: ((event: WorkflowUpdatedV1) => void) | null = null;
      let rejectWaiter: ((err: unknown) => void) | null = null;

      const cleanup = () => {
        if (timer !== undefined) {
          window.clearTimeout(timer);
          timer = undefined;
        }
        unsubscribe?.();
        waiterCancelRef.current = null;
      };

      const matches = (payload: WorkflowUpdatedV1) =>
        payload.workflowName === workflowName &&
        payload.idempotencyKey === idempotencyKey &&
        TERMINAL_WORKFLOW_STATUSES.has(payload.status);

      const settleFromEvent = (payload: WorkflowUpdatedV1) => {
        cleanup();
        if (payload.status === "COMPLETED") {
          resolveWaiter?.(payload);
        } else {
          rejectWaiter?.(new Error(payload.errorMessage || "Workflow execution failed"));
        }
      };

      const eventPromise = new Promise<WorkflowUpdatedV1>((resolve, reject) => {
        resolveWaiter = resolve;
        rejectWaiter = reject;
      });
      void eventPromise.catch(() => {
        // Prevent unhandled rejection when HTTP completes before the waiter is awaited.
      });

      unsubscribe = events.subscribe(
        "workflow:updated:v1",
        (payload) => {
          if (!matches(payload)) {
            return;
          }
          matchedEvent = payload;
          settleFromEvent(payload);
        },
        { replay: false },
      );

      timer = window.setTimeout(() => {
        cleanup();
        rejectWaiter?.(new WorkflowTimeoutError("Workflow timed out"));
      }, timeoutMs);

      waiterCancelRef.current = () => {
        cleanup();
        rejectWaiter?.(new Error("Workflow wait cancelled"));
      };

      try {
        const response = await trigger(idempotencyKey);

        if (!response?.workflowId) {
          cleanup();
          throw new Error("No workflow ID received");
        }

        if (response.status === "COMPLETED") {
          cleanup();
          return {
            response,
            event: matchedEvent ?? undefined,
          };
        }

        if (response.status && TERMINAL_WORKFLOW_STATUSES.has(response.status)) {
          cleanup();
          throw new Error(response.errorMessage || "Workflow execution failed");
        }

        const event = await eventPromise;
        return { response, event };
      } catch (error) {
        cleanup();
        throw error;
      }
    },
    [platform?.events, timeoutMs, workflowName],
  );

  return {
    awaitWorkflow,
  };
}
