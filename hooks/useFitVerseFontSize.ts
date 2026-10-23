'use client';

import { useLayoutEffect } from 'react';

interface FitOptions {
  maxRem?: number;
  minPx?: number;
}

// Puerto de fitVerseFontSize() (script.js): busca por bisección el mayor
// tamaño de fuente (entre minPx y maxRem·rootFont) que hace que el texto
// quepa en su contenedor, tanto en alto como en ancho — así un versículo
// corto se ve grande y uno largo se encoge en vez de desbordarse o recortarse.
// Es una mutación imperativa del DOM (sin estado de React) a propósito: es
// una medición post-layout, el mismo patrón que el posicionamiento de GridPicker.
export function useFitVerseFontSize(
  containerRef: React.RefObject<HTMLElement | null>,
  textRef: React.RefObject<HTMLElement | null>,
  deps: unknown[],
  options: FitOptions = {},
) {
  const { maxRem = 5 } = options;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    function fit() {
      if (!container || !textEl) return;
      const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const minPx = options.minPx ?? Math.max(14, 0.875 * rootFont);
      const maxPx = maxRem * rootFont;

      const containerStyle = getComputedStyle(container);
      const padTop = parseFloat(containerStyle.paddingTop) || 0;
      const padBottom = parseFloat(containerStyle.paddingBottom) || 0;
      const padLeft = parseFloat(containerStyle.paddingLeft) || 0;
      const padRight = parseFloat(containerStyle.paddingRight) || 0;

      let availableHeight = container.clientHeight - padTop - padBottom;
      let availableWidth = container.clientWidth - padLeft - padRight;

      Array.from(container.children).forEach((child) => {
        if (child === textEl) return;
        const childStyle = getComputedStyle(child);
        if (childStyle.display === 'none' || childStyle.visibility === 'hidden') return;
        if (childStyle.position === 'absolute' || childStyle.position === 'fixed') return;
        availableHeight -= (child as HTMLElement).offsetHeight;
      });

      if (availableHeight <= 24) availableHeight = Math.max(48, container.clientHeight * 0.5);
      if (availableWidth <= 40) availableWidth = Math.max(100, container.clientWidth - 32);

      textEl.style.boxSizing = 'border-box';
      const measuredWidth = Math.max(20, Math.floor(availableWidth));
      textEl.style.width = `${measuredWidth}px`;

      let low = Math.round(minPx);
      let high = Math.round(maxPx);
      let best = low;

      textEl.style.fontSize = `${high}px`;
      void textEl.offsetHeight;
      if (textEl.scrollHeight <= availableHeight && textEl.scrollWidth <= measuredWidth + 1) {
        textEl.style.fontSize = `${high}px`;
        textEl.style.width = '';
        return;
      }

      for (let i = 0; i < 12 && low <= high; i += 1) {
        const mid = Math.floor((low + high) / 2);
        textEl.style.fontSize = `${mid}px`;
        void textEl.offsetHeight;
        const fitsVert = textEl.scrollHeight <= availableHeight;
        const fitsHorz = textEl.scrollWidth <= measuredWidth + 1;
        if (fitsVert && fitsHorz) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      const finalSize = Math.max(minPx, best);
      textEl.style.fontSize = `${finalSize}px`;
      textEl.style.width = '';
    }

    fit();

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(fit, 140);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
