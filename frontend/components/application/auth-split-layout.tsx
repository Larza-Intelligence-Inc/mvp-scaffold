"use client";

import type { ReactNode } from "react";
import { LarzaLogo } from "@/components/foundations/logo/larza-logo";
import { cx } from "@/utils/cx";

type AuthSplitLayoutProps = {
    children: ReactNode;
    /** Headline shown on the visual panel. */
    panelTitle: string;
    /** Supporting line under the panel title. */
    panelSubtitle: string;
    className?: string;
};

/**
 * Full-viewport auth layout: form on the left, branded visual panel on the right (stacks on small screens).
 */
export function AuthSplitLayout({ children, panelTitle, panelSubtitle, className }: AuthSplitLayoutProps) {
    return (
        <main className={cx("flex min-h-dvh flex-col lg:flex-row", className)}>
            <section className="relative flex flex-1 flex-col justify-center bg-primary px-6 py-10 sm:px-10 lg:max-w-xl lg:px-14 xl:max-w-2xl xl:px-20">
                <div className="absolute top-6 left-6 sm:top-8 sm:left-10 lg:left-14 xl:left-20">
                    <LarzaLogo className="h-8" />
                </div>
                <div className="mx-auto w-full max-w-md pt-14 lg:mx-0 lg:pt-0">{children}</div>
            </section>

            <aside
                aria-hidden="true"
                className="relative hidden min-h-[42vh] flex-1 overflow-hidden lg:flex lg:min-h-dvh"
            >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,var(--color-brand-300)_0%,transparent_55%),radial-gradient(ellipse_at_80%_0%,var(--color-brand-200)_0%,transparent_45%),radial-gradient(ellipse_at_70%_80%,var(--color-brand-500)_0%,transparent_50%),linear-gradient(160deg,var(--color-brand-800)_0%,var(--color-brand-950)_55%,#1a100c_100%)]" />
                <div
                    className="absolute inset-0 opacity-[0.18]"
                    style={{
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.35'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                    }}
                />
                <div className="relative z-10 flex w-full flex-col justify-end p-10 xl:p-14">
                    <div className="max-w-md animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <p className="font-display text-4xl font-medium tracking-tight text-white xl:text-5xl">{panelTitle}</p>
                        <p className="mt-4 text-lg text-brand-100">{panelSubtitle}</p>
                    </div>
                </div>
            </aside>

            {/* Mobile visual strip — keeps brand presence without eating the form viewport */}
            <aside className="relative flex min-h-36 flex-col justify-end overflow-hidden px-6 py-8 lg:hidden">
                <div className="absolute inset-0 bg-[linear-gradient(160deg,var(--color-brand-700)_0%,var(--color-brand-950)_100%)]" />
                <div className="relative z-10">
                    <p className="font-display text-2xl font-medium tracking-tight text-white">{panelTitle}</p>
                    <p className="mt-2 text-sm text-brand-100">{panelSubtitle}</p>
                </div>
            </aside>
        </main>
    );
}
