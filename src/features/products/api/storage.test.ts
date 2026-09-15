import { afterEach, describe, expect, it, vi } from "vitest";
import { collapseRequiredHeaders, putPresignedObject } from "./storage";

describe("collapseRequiredHeaders", () => {
  it("sends a single Content-Type when both casings are present", () => {
    expect(
      collapseRequiredHeaders({
        "content-type": "image/jpeg",
        "Content-Type": "image/jpeg",
        host: "seaweedfs:8333",
      }),
    ).toEqual({ "Content-Type": "image/jpeg" });
  });
});

describe("putPresignedObject", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PUTs the file with only required headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["abc"], "hero.jpg", { type: "image/jpeg" });

    await putPresignedObject("https://s3.test/key", file, { "Content-Type": "image/jpeg" });

    expect(fetchMock).toHaveBeenCalledWith("https://s3.test/key", {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: file,
    });
  });

  it("collapses duplicate Content-Type casings before fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await putPresignedObject("https://s3.test/key", new Blob(["x"]), {
      "content-type": "image/jpeg",
      "Content-Type": "image/jpeg",
    });

    expect(fetchMock).toHaveBeenCalledWith("https://s3.test/key", {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: expect.any(Blob),
    });
  });

  it("throws when storage returns an error status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(
      putPresignedObject("https://s3.test/key", new Blob(["x"])),
    ).rejects.toThrow("Storage upload failed (403)");
  });

  it("throws when the contract method is not PUT", async () => {
    await expect(
      putPresignedObject("https://s3.test/key", new Blob(["x"]), {}, "POST"),
    ).rejects.toThrow("Unsupported storage upload method (POST)");
  });
});
