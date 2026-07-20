"use client";

import { ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export function WelcomeActions() {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button color="primary" size="lg" href="/showcase" iconTrailing={ArrowRight}>
                Browse components
            </Button>
            <Button color="secondary" size="lg" href="https://www.untitledui.com/react" target="_blank">
                Untitled UI docs
            </Button>
        </div>
    );
}
