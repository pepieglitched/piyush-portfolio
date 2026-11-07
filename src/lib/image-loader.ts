// Pre-optimized variants keep Next/Image responsive on static hosting.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith('/images/')) return src;
  const size = width <= 640 ? 640 : width <= 828 ? 828 : width <= 1080 ? 1080 : 1600;
  const format = /^\/images\/hero(?:-transparent)?\./.test(src) ? 'avif' : 'webp';
  return src.replace(/\.(png|jpe?g|webp)$/, `-${size}.${format}`);
}
