"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon01, Sun } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

/** Untitled UI dark-mode toggle via next-themes (`light-mode` / `dark-mode` classes). */
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedTheme === "dark";

    return (
        <ButtonUtility
            size="sm"
            color="tertiary"
            icon={isDark ? Sun : Moon01}
            tooltip={isDark ? "Light mode" : "Dark mode"}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />
    );
}
