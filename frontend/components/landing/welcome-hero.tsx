"use client";

import { ArrowRight } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";

export function WelcomeHero({ apiMessage }: { apiMessage: string }) {
    return (
        <div className="flex max-w-xl flex-col gap-8">
            <div className="flex flex-col gap-4">
                <Badge type="pill-color" color="brand" size="sm">
                    MVP Scaffold
                </Badge>
                <div className="flex flex-col gap-3">
                    <h1 className="text-display-md font-semibold text-primary">Welcome</h1>
                    <p className="text-md text-tertiary">
                        A full-stack starter with Next.js, Hono, PostgreSQL, and Untitled UI. Use this as a blank
                        canvas for your product.
                    </p>
                </div>
            </div>

            <div className="rounded-xl bg-secondary p-4 ring-1 ring-secondary">
                <p className="text-md text-secondary">
                    <strong className="text-primary">API says:</strong> {apiMessage}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <Button color="primary" size="lg" href="/showcase" iconTrailing={ArrowRight}>
                    Browse components
                </Button>
                <Button color="secondary" size="lg" href="https://www.untitledui.com/react" target="_blank">
                    Untitled UI docs
                </Button>
            </div>
        </div>
    );
}
