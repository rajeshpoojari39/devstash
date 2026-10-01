import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges single class names correctly", () => {
    expect(cn("px-2 py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isPending = false;
    expect(cn("base-class", isActive && "active", isPending && "pending")).toBe(
      "base-class active",
    );
  });

  it("resolves Tailwind class conflicts via tailwind-merge", () => {
    expect(cn("px-2 text-red-500", "px-4 text-blue-500")).toBe(
      "px-4 text-blue-500",
    );
  });

  it("ignores falsy, null, and undefined values", () => {
    expect(cn("base", null, undefined, false, "", 0 && "extra")).toBe("base");
  });

  it("merges array and object class representations", () => {
    expect(
      cn(["btn", "btn-primary"], { "opacity-50": true, hidden: false }),
    ).toBe("btn btn-primary opacity-50");
  });
});
