import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton, SkeletonText } from "./Skeleton";

describe("Skeleton", () => {
  it("renders with animate-pulse", () => {
    const { container } = render(<Skeleton className="h-10" />);
    expect(container.firstChild).toHaveClass("animate-pulse");
  });

  it("renders line count from lines prop", () => {
    const { container } = render(<SkeletonText lines={3} />);
    expect(container.firstChild.childNodes).toHaveLength(3);
  });
});
