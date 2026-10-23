import { VoiceMicWidget } from '@/components/voice/VoiceMicWidget';

// Deliberadamente en /biblia/leer/layout.tsx (no en el page.tsx de
// [book]/[chapter]/[verse]): Next.js remonta el page.tsx entero en cada
// navegación entre versículos (el segmento dinámico cambia), lo que reiniciaba
// el reconocimiento de voz — isListening volvía a false — justo después de
// que el modo IA detectara un versículo y navegara. Un layout en una ruta
// SIN segmentos dinámicos propios persiste entre esas navegaciones, así que
// el widget (y el micrófono activo dentro de él) sobreviven al cambio de
// versículo. VoiceMicWidget obtiene el versículo actual vía useParams() en
// vez de recibirlo por props, ya que este layout está por encima de
// [book]/[chapter]/[verse] y no los recibe directamente.
export default function LeerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <VoiceMicWidget />
    </>
  );
}
