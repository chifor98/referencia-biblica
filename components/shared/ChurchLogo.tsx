interface ChurchLogoProps {
  className?: string;
}

// Copia fiel de la puerta de la iglesia (foto de referencia del usuario):
// dos bloques sólidos (gris claro + contorno oscuro) con una muesca
// rectangular cada uno en el borde interior. La cruz latina es el espacio
// negativo (transparente, deja ver el fondo detrás) entre ambos: angosto en
// el palo vertical, ancho donde coinciden las dos muescas (brazo
// horizontal). Los dos remates superiores llevan la misma inclinación
// ascendente hacia la derecha (no en espejo/a dos aguas), y el bloque
// izquierdo queda a un nivel inferior al derecho (mismo ángulo, remate más
// cerca de la muesca) — la muesca y la base son iguales en ambos para que
// el brazo horizontal de la cruz siga alineado.
//
// Componente compartido (en vez de duplicar el SVG) entre HomeCover (grande,
// en la portada) y HeaderNav (pequeño, junto al título, en todas las páginas).
export function ChurchLogo({ className }: ChurchLogoProps) {
  return (
    <svg viewBox="0 0 90 150" className={className} aria-hidden="true">
      <path
        d="M12,50 L40,30 L40,60 L20,60 L20,80 L40,80 L40,145 L12,145 Z"
        fill="#cfcfcf"
        stroke="#3d2817"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <path
        d="M50,35 L78,15 L78,145 L50,145 L50,80 L70,80 L70,60 L50,60 Z"
        fill="#cfcfcf"
        stroke="#3d2817"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
