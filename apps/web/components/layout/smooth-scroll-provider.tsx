"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        smoothWheel: true,
        lerp: 0.08,
        duration: 1.15,
        anchors: {
          offset: -92,
          duration: 1.15
        },
        allowNestedScroll: true
      }}
    >
      {children}
    </ReactLenis>
  );
}
