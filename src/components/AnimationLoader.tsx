'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
const Experience = dynamic(() => import('./Experience'), {ssr:false});
/** Readable first paint comes first; the narrative engine wakes on visitor intent. */
export default function AnimationLoader(){
 const [active,setActive]=useState(false);
 useEffect(()=>{
   if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
   const events=['pointermove','wheel','touchstart','keydown'] as const;
   const start=()=>{document.documentElement.dataset.interacting='true';setActive(true);events.forEach(name=>window.removeEventListener(name,start));};
   events.forEach(name=>window.addEventListener(name,start,{passive:true,once:true}));
   return()=>events.forEach(name=>window.removeEventListener(name,start));
 },[]);
 return active?<Experience/>:null;
}
