import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RupiahInput from "./RupiahInput";

describe("RupiahInput", () => {
  it("menampilkan nilai awal terformat", () => {
    render(<RupiahInput value="200000" onChange={() => {}} />);
    expect(screen.getByDisplayValue("200.000")).toBeInTheDocument();
  });

  it("emisi nilai plain saat mengetik", () => {
    const onChange = vi.fn();
    render(<RupiahInput value="" onChange={onChange} aria-label="Nominal" />);
    const input = screen.getByLabelText("Nominal");
    fireEvent.change(input, { target: { value: "200000" } });
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0][0].target.value).toBe("200000");
  });

  it("menyaring karakter non-numerik", () => {
    const onChange = vi.fn();
    render(<RupiahInput value="" onChange={onChange} aria-label="Nominal" />);
    const input = screen.getByLabelText("Nominal");
    fireEvent.change(input, { target: { value: "Rp 20a0.000b" } });
    expect(onChange.mock.calls[0][0].target.value).toBe("200000");
  });

  it("backspace tepat setelah titik menghapus digit sebelum titik", () => {
    const onChange = vi.fn();
    render(<RupiahInput value="200000" onChange={onChange} aria-label="Nominal" />);
    const input = screen.getByLabelText("Nominal");
    // display "200.000", posisi 4 tepat setelah titik pertama
    input.setSelectionRange(4, 4);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenCalledOnce();
    // plain "200000" hapus digit index 2 -> "20000"
    expect(onChange.mock.calls[0][0].target.value).toBe("20000");
  });

  it("mendukung disabled dan placeholder", () => {
    render(
      <RupiahInput value="" onChange={() => {}} disabled placeholder="Nominal (Rp)" />
    );
    const input = screen.getByPlaceholderText("Nominal (Rp)");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("mendukung onValueChange dengan plain dan numerik", () => {
    const onValueChange = vi.fn();
    render(
      <RupiahInput value="" onChange={() => {}} onValueChange={onValueChange} aria-label="Nominal" />
    );
    fireEvent.change(screen.getByLabelText("Nominal"), {
      target: { value: "1500000" },
    });
    expect(onValueChange).toHaveBeenCalledWith("1500000", 1500000);
  });
});
