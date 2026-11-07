import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Instrument_Serif, IBM_Plex_Mono, Press_Start_2P } from 'next/font/google';
import Navigation from '@/components/Navigation';
import AnimationLoader from '@/components/AnimationLoader';
import { siteUrl } from '@/lib/site';
import '@/styles/globals.scss';
const space = Space_Grotesk({ subsets:['latin'], variable:'--font-space', display:'swap' });
const serif = Instrument_Serif({ subsets:['latin'], weight:'400', style:['normal','italic'], variable:'--font-serif', display:'swap', preload:false });
const mono = IBM_Plex_Mono({ subsets:['latin'], weight:['400','500'], variable:'--font-mono', display:'swap', preload:false });
const pixel = Press_Start_2P({ subsets:['latin'], weight:'400', variable:'--font-pixel', display:'swap', preload:false });
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), title: { default: 'Piyush Rajput — The Builder’s Mind', template: '%s — Piyush Rajput' },
  description: 'From curiosity to creation. Explore Piyush Rajput’s work in AI, interactive software, 3D web, and physical systems — with a playable intermission.',
  alternates:{ canonical:'/' }, authors:[{name:'Piyush Rajput'}],
  openGraph:{ type:'website', locale:'en_IN', siteName:'Piyush Rajput', title:'Piyush Rajput — The Builder’s Mind', description:'AI. Software. Physical systems. A portfolio you can play a part in.', url:siteUrl, images:[{url:'/og.png',width:1200,height:630,alt:'Piyush Rajput — The Builder’s Mind'}] },
  twitter:{card:'summary_large_image',images:['/og.png']}, robots:{index:true,follow:true},
  // The wordmark is the only branding. Suppress the browser's implicit favicon request.
  icons: { icon: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E' },
};
export const viewport: Viewport = { themeColor:'#F3F0E8' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={`${space.variable} ${serif.variable} ${mono.variable} ${pixel.variable}`}><body><a className="skip-link" href="#main">Skip to content</a><Navigation/>{children}<AnimationLoader/></body></html>;
}
