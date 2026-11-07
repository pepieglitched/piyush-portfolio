"use client";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import styles from './Navigation.module.scss';
function MenuPanel({children}:{children:ReactNode}) {
  const reduce = useReducedMotion();
  const present = useIsPresent();
  return <motion.div id="mobile-navigation" className={styles.mobile} inert={!present} aria-hidden={!present} style={{pointerEvents:present ? 'auto' : 'none'}} initial={{opacity:reduce ? 1 : 0,y:reduce ? 0 : -8,scale:reduce ? 1 : .985}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:reduce ? 0 : -5,scale:reduce ? 1 : .99}} transition={{duration:reduce ? 0 : .25,ease:[.2,.7,.2,1]}}>{children}</motion.div>;
}
export default function NavigationMenu({children,open}:{children:ReactNode;open:boolean}) {
  return <AnimatePresence>{open && <MenuPanel key="mobile-menu">{children}</MenuPanel>}</AnimatePresence>;
}
