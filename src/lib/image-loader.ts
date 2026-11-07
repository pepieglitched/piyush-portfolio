// Pre-optimized variants keep Next/Image responsive on static hosting.
export default function imageLoader({ src, width }: { src: string; width: number }) {
  if (!src.startsWith('/images/')) return src;
  if (src === '/images/closing-portrait.png') {
    const portraitWidth = width <= 256 ? 256 : width <= 512 ? 512 : 768;
    return `/images/closing-portrait-${portraitWidth}.avif`;
  }
  const size = width <= 640 ? 640 : width <= 828 ? 828 : width <= 1080 ? 1080 : 1600;
  const format = /^\/images\/hero(?:-transparent)?\./.test(src) ? 'avif' : 'webp';
  return src.replace(/\.(png|jpe?g|webp)$/, `-${size}.${format}`);
}
