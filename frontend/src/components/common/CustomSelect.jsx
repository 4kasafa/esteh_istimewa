import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({ 
  value, 
  options, 
  placeholder = "Pilih...", 
  onChange,
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current && !containerRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange(option);
    setIsOpen(false);
  };

  const selectedLabel = options.find(opt => opt === value) || value || placeholder;

  const dropdownMenu = isOpen && createPortal(
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="rounded-2xl border border-brand-green/10 bg-white py-2 shadow-2xl shadow-brand-green-dark/10 animate-fade-in max-h-60 overflow-y-auto no-scrollbar"
    >
      {options.length === 0 ? (
        <div className="px-4 py-2 text-xs font-bold text-brand-muted italic">Tidak ada opsi</div>
      ) : (
        options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`
              w-full px-4 py-2.5 text-sm font-bold text-left transition-colors
              ${value === opt ? "bg-brand-green/5 text-brand-green" : "text-brand-green-dark hover:bg-brand-bg"}
            `}
            onClick={() => handleSelect(opt)}
          >
            <div className="flex items-center justify-between">
              <span>{opt}</span>
              {value === opt && (
                <div className="h-1.5 w-1.5 rounded-full bg-brand-green" />
              )}
            </div>
          </button>
        ))
      )}
    </div>,
    document.body
  );

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`
          w-full flex items-center justify-between gap-2 rounded-xl border border-brand-green/10 bg-white px-3.5 py-2.5 text-sm font-bold text-brand-green-dark text-left
          focus:outline-none focus:ring-4 focus:ring-brand-green/5 focus:border-brand-green transition-all shadow-sm
          ${disabled ? "bg-brand-bg/50 cursor-not-allowed opacity-70" : "cursor-pointer hover:border-brand-green/30"}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className={!value ? "text-brand-muted/40" : ""}>{selectedLabel}</span>
        <ChevronDown 
          size={16} 
          className={`text-brand-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>
      {dropdownMenu}
    </div>
  );
}
