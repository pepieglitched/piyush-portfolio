'use client';
import dynamic from 'next/dynamic';
import { useMotionActive } from '@/lib/motion-activation';
const Experience = dynamic(() => import('./Experience'), {ssr:false});
/** Readable first paint comes first; the narrative engine wakes on visitor intent. */
export default function AnimationLoader(){
 const active=useMotionActive();
 return active?<Experience/>:null;
}
