'use client';
import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import styles from './Navigation.module.scss';
export default function NavigationMenu({children}:{children:ReactNode}){
 const reduce=useReducedMotion();
 return <motion.div id="mobile-navigation" className={styles.mobile} initial={{opacity:0,y:reduce?0:-8}} animate={{opacity:1,y:0}} transition={{duration:reduce?0:.2}}>{children}</motion.div>;
}
