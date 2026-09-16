import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  useWorkflowAwaiter,
  type WorkflowUpdatedV1,
} from "./use-workflow-awaiter";
import type { PlatformEvents } from "@khinemyaezin/seller-contracts";

function createMockPlatform(subscribers: Map<string, Set<(payload: any) => void>>) {
  const events: Partial<PlatformEvents> = {
    subscribe: vi.fn((topic: string, handler: (payload: any) => void) => {
      if (!subscribers.has(topic)) {
        subscribers.set(topic, new Set());
      }
      subscribers.get(topic)!.add(handler);
      return () => {
        subscribers.get(topic)?.delete(handler);
      };
    }),
    emit: vi.fn(),
  };

  return { events: events as PlatformEvents };
}

vi.mock("@khinemyaezin/seller-ui", () => ({
  usePlatform: vi.fn(),
}));

import { usePlatform } from "@khinemyaezin/seller-ui";

const IDEMPOTENCY_KEY =
  "11111111-1111-4111-8111-111111111111" as `${string}-${string}-${string}-${string}-${string}`;

function terminalEvent(
  overrides: Partial<WorkflowUpdatedV1> = {},
): WorkflowUpdatedV1 {
  return {
    producerId: "backend",
    workflowId: "wf-1",
    workflowName: "update-sellable-product",
    status: "COMPLETED",
    idempotencyKey: IDEMPOTENCY_KEY,
    ...overrides,
  };
}

describe("useWorkflowAwaiter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("generates an idempotencyKey, subscribes before the trigger, and passes the key in", async () => {
    const subscribers = new Map<string, Set<(payload: any) => void>>();
    const mockPlatform = createMockPlatform(subscribers);
    vi.mocked(usePlatform).mockReturnValue(mockPlatform as any);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(IDEMPOTENCY_KEY);

    const { result } = renderHook(() =>
      useWorkflowAwaiter({ workflowName: "update-sellable-product" }),
    );

    const trigger = vi.fn().mockImplementation(async (idempotencyKey: string) => {
      expect(mockPlatform.events.subscribe).toHaveBeenCalledWith(
        "workflow:updated:v1",
        expect.any(Function),
        { replay: false },
      );
      expect(idempotencyKey).toBe(IDEMPOTENCY_KEY);
      return {
        workflowId: "wf-1",
        status: "COMPLETED",
      };
    });

    const output = await result.current.awaitWorkflow(trigger);

    expect(output).toEqual({
      response: {
        workflowId: "wf-1",
        status: "COMPLETED",
      },
      event: undefined,
    });
    expect(trigger).toHaveBeenCalledWith(IDEMPOTENCY_KEY);
  });

  it("captures an SSE event that arrives while trigger is still in flight", async () => {
    const subscribers = new Map<string, Set<(payload: any) => void>>();
    const mockPlatform = createMockPlatform(subscribers);
    vi.mocked(usePlatform).mockReturnValue(mockPlatform as any);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(IDEMPOTENCY_KEY);

    const { result } = renderHook(() =>
      useWorkflowAwaiter({ workflowName: "update-sellable-product" }),
    );

    const event = terminalEvent({ workflowId: "wf-2" });

    let resolveTrigger!: (val: any) => void;
    const triggerPromise = new Promise((resolve) => {
      resolveTrigger = resolve;
    });

    const awaitPromise = result.current.awaitWorkflow(
      () => triggerPromise as Promise<any>,
    );

    const handlers = subscribers.get("workflow:updated:v1");
    expect(handlers?.size).toBe(1);
    handlers?.forEach((fn) => fn(event));

    resolveTrigger({
      workflowId: "wf-2",
      status: "WAITING_EXTERNAL",
    });

    const output = await awaitPromise;

    expect(output).toEqual({
      response: {
        workflowId: "wf-2",
        status: "WAITING_EXTERNAL",
      },
      event,
    });
  });

  it("waits for an SSE event that arrives after trigger resolves", async () => {
    const subscribers = new Map<string, Set<(payload: any) => void>>();
    const mockPlatform = createMockPlatform(subscribers);
    vi.mocked(usePlatform).mockReturnValue(mockPlatform as any);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(IDEMPOTENCY_KEY);

    const { result } = renderHook(() =>
      useWorkflowAwaiter({ workflowName: "update-sellable-product" }),
    );

    const event = terminalEvent({ workflowId: "wf-3" });

    const trigger = vi.fn().mockResolvedValue({
      workflowId: "wf-3",
      status: "WAITING_EXTERNAL",
    });

    const awaitPromise = result.current.awaitWorkflow(trigger);

    await Promise.resolve();

    const handlers = subscribers.get("workflow:updated:v1");
    handlers?.forEach((fn) => fn(event));

    const output = await awaitPromise;

    expect(output).toEqual({
      response: {
        workflowId: "wf-3",
        status: "WAITING_EXTERNAL",
      },
      event,
    });
  });

  it("ignores terminal frames with a different idempotencyKey", async () => {
    const subscribers = new Map<string, Set<(payload: any) => void>>();
    const mockPlatform = createMockPlatform(subscribers);
    vi.mocked(usePlatform).mockReturnValue(mockPlatform as any);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(IDEMPOTENCY_KEY);

    const { result } = renderHook(() =>
      useWorkflowAwaiter({ workflowName: "create-sellable-product" }),
    );

    const trigger = vi.fn().mockResolvedValue({
      workflowId: "wf-create",
      status: "WAITING_EXTERNAL",
    });

    const awaitPromise = result.current.awaitWorkflow(trigger);
    await Promise.resolve();

    const handlers = subscribers.get("workflow:updated:v1");
    handlers?.forEach((fn) =>
      fn(
        terminalEvent({
          workflowId: "wf-other",
          workflowName: "create-sellable-product",
          idempotencyKey: "other-key",
        }),
      ),
    );

    const matching = terminalEvent({
      workflowId: "wf-create",
      workflowName: "create-sellable-product",
    });
    handlers?.forEach((fn) => fn(matching));

    await expect(awaitPromise).resolves.toEqual({
      response: {
        workflowId: "wf-create",
        status: "WAITING_EXTERNAL",
      },
      event: matching,
    });
  });

  it("rejects when a matching terminal event is FAILED", async () => {
    const subscribers = new Map<string, Set<(payload: any) => void>>();
    const mockPlatform = createMockPlatform(subscribers);
    vi.mocked(usePlatform).mockReturnValue(mockPlatform as any);
    vi.spyOn(crypto, "randomUUID").mockReturnValue(IDEMPOTENCY_KEY);

    const { result } = renderHook(() =>
      useWorkflowAwaiter({ workflowName: "update-sellable-product" }),
    );

    const trigger = vi.fn().mockResolvedValue({
      workflowId: "wf-fail",
      status: "WAITING_EXTERNAL",
    });

    const awaitPromise = result.current.awaitWorkflow(trigger);
    await Promise.resolve();

    const handlers = subscribers.get("workflow:updated:v1");
    handlers?.forEach((fn) =>
      fn(
        terminalEvent({
          workflowId: "wf-fail",
          status: "FAILED",
          errorMessage: "Catalog write failed",
        }),
      ),
    );

    await expect(awaitPromise).rejects.toThrow("Catalog write failed");
  });
});
