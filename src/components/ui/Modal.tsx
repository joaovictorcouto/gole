import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  maxWidth?: number;
  children?: React.ReactNode;
  /** When set, a tinted accent strip appears on top (matches onboarding result style). */
  accent?: boolean;
  /** If false, clicking outside the modal will not close it. */
  closeOnBackdrop?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  iconColor = "#257ca3",
  iconBg = "#bfe8ff",
  maxWidth = 460,
  children,
  accent = false,
  closeOnBackdrop = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const getFocusableElements = () => {
      if (!modalRef.current) return [];
      const els = Array.from(
        modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];
      
      const closeBtn = els.find(el => el.getAttribute("aria-label") === "Fechar");
      if (closeBtn) {
        const others = els.filter(el => el !== closeBtn);
        return [...others, closeBtn];
      }
      return els;
    };

    const focusFirst = () => {
      const focusables = getFocusableElements();
      if (focusables.length > 0) {
        // Tenta focar o primeiro botão que não seja o de fechar (ex: botão Cancelar)
        const actionButton = focusables.find(
          (el) => el.getAttribute("aria-label") !== "Fechar"
        );
        if (actionButton) {
          actionButton.focus();
        } else {
          focusables[0].focus();
        }
      }
    };

    const timer = setTimeout(focusFirst, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      const focusables = getFocusableElements();
      if (focusables.length === 0) return;

      const activeEl = document.activeElement as HTMLElement;
      let currentIndex = focusables.indexOf(activeEl);

      const moveTo = (index: number) => {
        e.preventDefault();
        focusables[index].focus();
      };

      if (e.key === "Tab") {
        if (e.shiftKey) {
          const prevIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
          moveTo(prevIndex);
        } else {
          const nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
          moveTo(nextIndex);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        const nextIndex = currentIndex === focusables.length - 1 ? 0 : currentIndex + 1;
        moveTo(nextIndex);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        const prevIndex = currentIndex <= 0 ? focusables.length - 1 : currentIndex - 1;
        moveTo(prevIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
      style={{ backgroundColor: "rgba(25,28,30,0.35)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full rounded-[1.5rem] relative overflow-hidden"
        style={{
          maxWidth: `${maxWidth}px`,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.9)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        {accent && (
          <div className="absolute top-0 left-0 w-full h-1"
            style={{ background: "linear-gradient(90deg, #257ca3, #006492, #0f76a0)" }} />
        )}

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-[#eceef1] focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
          style={{ color: "#71787c" }}
          aria-label="Fechar"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="p-8 pt-10">
          {(icon || title || description) && (
            <div className="flex flex-col items-center text-center mb-6">
              {icon && (
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: iconBg }}>
                  <span className="material-symbols-outlined text-[32px]"
                    style={{ color: iconColor, fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                  </span>
                </div>
              )}
              {title && (
                <h2 className="text-xl font-semibold mb-2"
                  style={{ color: "#191c1e", letterSpacing: "-0.02em" }}>
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-sm" style={{ color: "#5B6572", lineHeight: "1.5" }}>
                  {description}
                </p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Pre-styled primary action button to use inside modals. */
export function ModalPrimaryButton({
  children, onClick, disabled = false,
}: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
      style={{
        background: "linear-gradient(180deg, #257ca3 0%, #0f76a0 100%)",
        boxShadow: disabled ? "none" : "0 8px 20px rgba(59,99,119,0.25)",
        opacity: disabled ? 0.4 : 1,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </button>
  );
}

/** Pre-styled secondary (ghost) button to use inside modals. */
export function ModalSecondaryButton({
  children, onClick,
}: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-xl font-medium text-sm border transition-all duration-200 hover:bg-[#f2f4f7] focus:outline-none focus:ring-2 focus:ring-[#257ca3] focus:ring-offset-2"
      style={{ color: "#5B6572", borderColor: "#e0e3e6", letterSpacing: "0.02em" }}
    >
      {children}
    </button>
  );
}
