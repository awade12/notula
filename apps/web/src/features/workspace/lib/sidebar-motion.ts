import type { Transition, Variants } from 'framer-motion'

export const sidebarMenuSpring: Transition = {
  type: 'spring',
  stiffness: 520,
  damping: 38,
  mass: 0.65,
}

export const sidebarMenuItemSpring: Transition = {
  type: 'spring',
  stiffness: 460,
  damping: 34,
  mass: 0.55,
}

export const sidebarMenuPanelVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: -8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
  },
}

export const sidebarMenuListVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.03,
    },
  },
}

export const sidebarMenuItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -8,
  },
  visible: {
    opacity: 1,
    x: 0,
  },
}

export const sidebarMenuButtonTap = {
  scale: 0.92,
}

export const sidebarExpandSpring: Transition = {
  type: 'spring',
  stiffness: 420,
  damping: 36,
  mass: 0.75,
}

export const sidebarWidthSpring: Transition = {
  type: 'spring',
  stiffness: 360,
  damping: 32,
  mass: 0.85,
}
