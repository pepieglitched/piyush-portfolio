import { THEME_KEY } from '@/lib/theme';

const restoreTheme =
  'try{if(localStorage.getItem(' + JSON.stringify(THEME_KEY) + ')==="cyber")document.documentElement.dataset.theme="cyber"}catch{}';

export default function ThemeScript() {
  // Run in the document head, before either theme can paint.
  return <script dangerouslySetInnerHTML={{ __html: restoreTheme }} />;
}
