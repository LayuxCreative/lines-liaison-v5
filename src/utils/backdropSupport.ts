/**
 * Utility functions for backdrop filter support detection and fallbacks
 */

/**
 * Detects if the browser supports backdrop-filter
 * @returns boolean indicating backdrop-filter support
 */
export const supportsBackdropFilter = (): boolean => {
  if (typeof window === "undefined") return false;

  // Check CSS.supports if available
  if (typeof CSS !== "undefined" && CSS.supports) {
    return (
      CSS.supports("backdrop-filter", "blur(1px)") ||
      CSS.supports("-webkit-backdrop-filter", "blur(1px)")
    );
  }

  // Fallback detection method
  const testElement = document.createElement("div");
  testElement.style.backdropFilter = "blur(1px)";
  testElement.style.webkitBackdropFilter = "blur(1px)";

  return (
    testElement.style.backdropFilter !== "" ||
    testElement.style.webkitBackdropFilter !== ""
  );
};

/**
 * Gets the appropriate backdrop styles based on browser support
 * @param blurAmount - The blur amount in pixels
 * @param fallbackOpacity - Opacity for fallback background
 * @returns CSS properties object
 */
export const getBackdropStyles = (
  blurAmount: number = 8,
  fallbackOpacity: number = 0.2,
): React.CSSProperties => {
  const hasSupport = supportsBackdropFilter();

  if (hasSupport) {
    return {
      backdropFilter: `blur(${blurAmount}px)`,
      WebkitBackdropFilter: `blur(${blurAmount}px)`,
      background: `rgba(0, 0, 0, ${fallbackOpacity * 0.5})`, // Lighter when blur is supported
    };
  }

  // Fallback for browsers without backdrop-filter support
  return {
    background: `rgba(0, 0, 0, ${fallbackOpacity})`,
  };
};

/**
 * Z-index constants for consistent layering
 */
export const Z_INDEX = {
  HEADER: 9000,
  DROPDOWN: 9500,
  MODAL_BACKDROP: 9998,
  MODAL_CONTENT: 9999,
  TOAST: 10000,
} as const;

/**
 * Applies backdrop blur effect to an element with proper fallbacks
 * @param element - The DOM element to apply the effect to
 * @param intensity - Blur intensity ('light' | 'medium' | 'strong')
 */
export const applyBackdropBlur = (
  element: HTMLElement,
  intensity: "light" | "medium" | "strong" = "medium",
): void => {
  const blurValues = {
    light: 4,
    medium: 8,
    strong: 12,
  };

  const blurAmount = blurValues[intensity];
  const styles = getBackdropStyles(blurAmount);

  Object.assign(element.style, styles);

  // Add CSS class for additional styling
  element.classList.add("backdrop-blur-applied");
};

/**
 * Removes backdrop blur effect from an element
 * @param element - The DOM element to remove the effect from
 */
export const removeBackdropBlur = (element: HTMLElement): void => {
  element.style.backdropFilter = "";
  element.style.webkitBackdropFilter = "";
  element.style.background = "";
  element.classList.remove("backdrop-blur-applied");
};
