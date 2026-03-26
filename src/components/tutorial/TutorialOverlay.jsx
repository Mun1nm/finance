import { useState, useEffect, useCallback, useRef } from "react";
import { useTutorial } from "../../contexts/TutorialContext";
import { TUTORIALS } from "./tutorialSteps";
import { X, ArrowRight, SkipForward } from "lucide-react";

export function TutorialOverlay() {
  const { activeTutorial, currentStep, nextStep, skipTutorial } = useTutorial();
  const [targetRect, setTargetRect] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});
  const [arrowDirection, setArrowDirection] = useState("up");
  const tooltipRef = useRef(null);
  const animFrameRef = useRef(null);

  const tutorial = activeTutorial ? TUTORIALS[activeTutorial] : null;
  const step = tutorial ? tutorial.steps[currentStep] : null;

  // Measure target element position
  const measureTarget = useCallback(() => {
    if (!step) return;
    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [step]);

  // Position tooltip relative to target
  const positionTooltip = useCallback(() => {
    if (!targetRect || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;
    const arrowSize = 10;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let top, left;
    let direction = "up";
    const position = step?.position || "bottom";

    if (position === "bottom" || position === "bottom-left") {
      top = targetRect.bottom + padding + arrowSize;
      direction = "up";
    } else if (position === "top") {
      top = targetRect.top - tooltipRect.height - padding - arrowSize;
      direction = "down";
    } else if (position === "left") {
      top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.left - tooltipRect.width - padding - arrowSize;
      direction = "right";
    } else if (position === "right") {
      top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
      left = targetRect.right + padding + arrowSize;
      direction = "left";
    }

    // Calculate horizontal center for top/bottom positions
    if (position === "bottom" || position === "top") {
      left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
    } else if (position === "bottom-left") {
      left = targetRect.right - tooltipRect.width;
    }

    // Clamp to viewport
    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportW - padding) {
      left = viewportW - padding - tooltipRect.width;
    }
    if (top < padding) {
      // Flip to bottom if overflowing top
      top = targetRect.bottom + padding + arrowSize;
      direction = "up";
    }
    if (top + tooltipRect.height > viewportH - padding) {
      // Flip to top if overflowing bottom
      top = targetRect.top - tooltipRect.height - padding - arrowSize;
      direction = "down";
    }

    setTooltipStyle({ top: `${top}px`, left: `${left}px` });
    setArrowDirection(direction);

    // Position arrow to point at the target center
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    if (direction === "up" || direction === "down") {
      const arrowLeft = targetCenterX - left - arrowSize;
      const clampedArrowLeft = Math.max(20, Math.min(arrowLeft, tooltipRect.width - 20));
      setArrowStyle({ left: `${clampedArrowLeft}px` });
    } else {
      const arrowTop = targetCenterY - top - arrowSize;
      const clampedArrowTop = Math.max(20, Math.min(arrowTop, tooltipRect.height - 20));
      setArrowStyle({ top: `${clampedArrowTop}px` });
    }
  }, [targetRect, step]);

  // Scroll target element into view and track position
  useEffect(() => {
    if (!activeTutorial || !step) {
      setIsVisible(false);
      return;
    }

    // First, scroll the target element into view
    const el = document.getElementById(step.targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    // Wait for scroll to finish, then show overlay
    const showTimeout = setTimeout(() => {
      measureTarget();
      setIsVisible(true);
    }, 400);

    const tick = () => {
      measureTarget();
      animFrameRef.current = requestAnimationFrame(tick);
    };
    // Start tracking after scroll settles
    const trackTimeout = setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(tick);
    }, 350);

    // Listen for resize/scroll
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(trackTimeout);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [activeTutorial, step, measureTarget]);

  // Position tooltip whenever targetRect changes
  useEffect(() => {
    positionTooltip();
  }, [targetRect, positionTooltip]);

  if (!activeTutorial || !step || !tutorial) return null;

  const isLastStep = currentStep >= tutorial.steps.length - 1;
  const spotlightPadding = 8;

  // Spotlight clip path (inverted rect)
  const getClipPath = () => {
    if (!targetRect) return "none";
    const x = targetRect.left - spotlightPadding;
    const y = targetRect.top - spotlightPadding;
    const w = targetRect.width + spotlightPadding * 2;
    const h = targetRect.height + spotlightPadding * 2;
    const r = 12; // border-radius

    // Create a polygon that covers the whole screen except the target rect (with rounded corners via SVG)
    return `polygon(
      0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
      ${x}px ${y + r}px,
      ${x + r}px ${y}px,
      ${x + w - r}px ${y}px,
      ${x + w}px ${y + r}px,
      ${x + w}px ${y + h - r}px,
      ${x + w - r}px ${y + h}px,
      ${x + r}px ${y + h}px,
      ${x}px ${y + h - r}px,
      ${x}px ${y + r}px
    )`;
  };

  const arrowEl = (() => {
    const base = "absolute w-0 h-0";
    if (arrowDirection === "up") {
      return (
        <div
          className={base}
          style={{
            ...arrowStyle,
            top: "-10px",
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderBottom: "10px solid rgba(30, 41, 59, 0.98)"
          }}
        />
      );
    }
    if (arrowDirection === "down") {
      return (
        <div
          className={base}
          style={{
            ...arrowStyle,
            bottom: "-10px",
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "10px solid rgba(30, 41, 59, 0.98)"
          }}
        />
      );
    }
    if (arrowDirection === "left") {
      return (
        <div
          className={base}
          style={{
            ...arrowStyle,
            left: "-10px",
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            borderRight: "10px solid rgba(30, 41, 59, 0.98)"
          }}
        />
      );
    }
    if (arrowDirection === "right") {
      return (
        <div
          className={base}
          style={{
            ...arrowStyle,
            right: "-10px",
            borderTop: "10px solid transparent",
            borderBottom: "10px solid transparent",
            borderLeft: "10px solid rgba(30, 41, 59, 0.98)"
          }}
        />
      );
    }
  })();

  return (
    <div
      className={`tutorial-overlay-container ${isVisible ? 'tutorial-visible' : ''}`}
      style={{ position: "fixed", inset: 0, zIndex: 9998 }}
    >
      {/* Dark overlay with spotlight cutout */}
      <div
        className="tutorial-overlay"
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          clipPath: targetRect ? getClipPath() : "none",
          transition: "clip-path 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        onClick={skipTutorial}
      />

      {/* Spotlight ring glow */}
      {targetRect && (
        <div
          className="tutorial-spotlight-ring"
          style={{
            position: "fixed",
            left: `${targetRect.left - spotlightPadding}px`,
            top: `${targetRect.top - spotlightPadding}px`,
            width: `${targetRect.width + spotlightPadding * 2}px`,
            height: `${targetRect.height + spotlightPadding * 2}px`,
            borderRadius: "12px",
            border: "2px solid rgba(96, 165, 250, 0.6)",
            boxShadow: "0 0 20px rgba(96, 165, 250, 0.3), inset 0 0 20px rgba(96, 165, 250, 0.05)",
            pointerEvents: "none",
            transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="tutorial-tooltip"
        style={{
          position: "fixed",
          ...tooltipStyle,
          zIndex: 9999,
          maxWidth: "360px",
          width: "calc(100vw - 32px)"
        }}
      >
        {/* Arrow */}
        {arrowEl}

        {/* Content */}
        <div
          style={{
            background: "rgba(30, 41, 59, 0.98)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(96, 165, 250, 0.3)",
            borderRadius: "16px",
            padding: "20px",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(96, 165, 250, 0.1)"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f1f5f9", margin: 0, lineHeight: "1.4" }}>
              {step.title}
            </h3>
            <button
              onClick={skipTutorial}
              style={{
                background: "none",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: "2px",
                marginLeft: "8px",
                flexShrink: 0,
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.target.style.color = "#94a3b8"}
              onMouseLeave={(e) => e.target.style.color = "#64748b"}
              title="Fechar tutorial"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description */}
          <p style={{
            fontSize: "13px",
            color: "#94a3b8",
            lineHeight: "1.6",
            margin: "0 0 16px 0"
          }}>
            {step.description}
          </p>

          {/* Footer: progress + actions */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(148, 163, 184, 0.1)",
            paddingTop: "14px"
          }}>
            {/* Step indicator */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              {tutorial.steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === currentStep ? "20px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    background: i === currentStep
                      ? "linear-gradient(135deg, #3b82f6, #60a5fa)"
                      : i < currentStep
                        ? "#3b82f6"
                        : "rgba(148, 163, 184, 0.2)",
                    transition: "all 0.3s ease"
                  }}
                />
              ))}
              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "6px" }}>
                {currentStep + 1}/{tutorial.steps.length}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={skipTutorial}
                style={{
                  background: "none",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  color: "#64748b",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.4)";
                  e.currentTarget.style.color = "#94a3b8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                <SkipForward size={12} /> Pular
              </button>

              <button
                onClick={() => nextStep(tutorial.steps.length)}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  border: "none",
                  color: "#fff",
                  padding: "6px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
                }}
              >
                {isLastStep ? "Entendi!" : <>Próximo <ArrowRight size={12} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
