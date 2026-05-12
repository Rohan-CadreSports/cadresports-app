"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function ScrollReset() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Scroll the main content area back to top on route change
      const main = document.querySelector("main");
      if (main) main.scrollTop = 0;
      prevPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
