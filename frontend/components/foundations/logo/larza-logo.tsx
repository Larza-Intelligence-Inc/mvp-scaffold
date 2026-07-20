"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

/** Larza wordmark — clay mark + Newsreader lockup. */
export function LarzaLogo({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={cx("flex h-8 w-max items-center gap-2.5", className)}>
            <span className="size-7 shrink-0 rounded-full bg-brand-solid" aria-hidden />
            <span className="font-display text-xl font-medium tracking-tight text-primary">Larza</span>
        </div>
    );
}
