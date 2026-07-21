"use client";

import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

/** Compact Larza mark for collapsed navigation. */
export function LarzaLogoMinimal({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div {...props} className={cx("flex size-8 items-center justify-center", className)}>
            <span className="size-7 shrink-0 rounded-full bg-brand-solid" aria-hidden />
            <span className="sr-only">Larza</span>
        </div>
    );
}
