export const motionTiming = { fast: .45, reveal: .95, cinematic: 1.35, stagger: .065 } as const;
export const motionEase = { editorial: 'power3.out', soft: 'power2.inOut', sweep: 'expo.out' } as const;
export type ChapterKind = 'hero' | 'mind' | 'education' | 'work' | 'game' | 'skills' | 'evidence' | 'becoming' | 'contact';
