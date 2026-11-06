import type { MetadataRoute } from 'next';
import { projects } from '@/content/portfolio';
import { siteUrl } from '@/lib/site';
export const dynamic = 'force-static';
export default function sitemap():MetadataRoute.Sitemap { return [{url:siteUrl,changeFrequency:'monthly',priority:1},{url:`${siteUrl}/projects/`,changeFrequency:'monthly',priority:.8},...projects.map(p=>({url:`${siteUrl}/projects/${p.slug}/`,changeFrequency:'monthly' as const,priority:.7}))]; }
