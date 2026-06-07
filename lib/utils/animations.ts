import { Variants } from "framer-motion";

/**
 * Standardized Spring Physics for a physical, organic feel.
 * Apple-like fluidity: high stiffness, high damping.
 */
export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

/**
 * Fade up animation variant for entry animations.
 */
export const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: springTransition },
  exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
};

/**
 * Stagger container for list items.
 */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

/**
 * Sidebar expand/collapse variant.
 */
export const sidebarVariants: Variants = {
  expanded: { width: 280, transition: springTransition },
  collapsed: { width: 80, transition: springTransition },
};

/**
 * Item hover variant for interactive glass cards.
 */
export const hoverScale = {
  whileHover: { scale: 1.02, y: -2 },
  whileTap: { scale: 0.98 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
};
