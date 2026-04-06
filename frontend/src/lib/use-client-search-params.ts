"use client";

import { useEffect, useState } from "react";

export function useClientSearchParams() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null,
  );

  useEffect(() => {
    const syncSearchParams = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };

    syncSearchParams();
    window.addEventListener("popstate", syncSearchParams);

    return () => {
      window.removeEventListener("popstate", syncSearchParams);
    };
  }, []);

  return searchParams;
}
