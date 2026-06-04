export const springGentle = { type: "spring" as const, stiffness: 260, damping: 28 };
export const springSnappy = { type: "spring" as const, stiffness: 400, damping: 32 };

export const fadeSlide = {
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, filter: "blur(4px)" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

export const scaleFade = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.94 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
};
