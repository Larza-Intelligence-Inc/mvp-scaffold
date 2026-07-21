"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Building07, HomeLine, Settings01, Users01 } from "@untitledui/icons";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import type { NavAccountType } from "@/components/application/app-navigation/base-components/nav-account-card";
import { ThemeToggle } from "@/components/application/theme-toggle";
import { authClient } from "@/lib/auth-client";

const SIDEBAR_COLLAPSED_KEY = "larza.sidebar.collapsed";

const navItems = [
    { label: "Home", href: "/dashboard", icon: HomeLine },
    { label: "Organizations", href: "/dashboard/organizations", icon: Building07 },
    { label: "Members", href: "/dashboard/members", icon: Users01 },
    { label: "Settings", href: "/dashboard/settings", icon: Settings01 },
];

const titles: Record<string, string> = {
    "/dashboard": "Home",
    "/dashboard/organizations": "Organizations",
    "/dashboard/members": "Members",
    "/dashboard/settings": "Settings",
    "/dashboard/profile": "Profile",
};

type DashboardShellProps = {
    children: ReactNode;
    title?: string;
};

export function DashboardShell({ children, title }: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
            if (stored === "1") {
                setIsCollapsed(true);
            }
        } catch {
            // Ignore storage errors (private mode, etc.)
        }
    }, []);

    function toggleCollapse() {
        setIsCollapsed((prev) => {
            const next = !prev;
            try {
                window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    }

    const user = session?.user;
    const account: NavAccountType | undefined = user
        ? {
              id: user.id,
              name: user.name || user.email,
              email: user.email,
              avatar: user.image ?? "",
              status: "online",
          }
        : undefined;

    async function signOut() {
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
    }

    const pageTitle = title ?? titles[pathname] ?? "Dashboard";

    return (
        <div className="flex min-h-dvh flex-col bg-secondary lg:flex-row">
            <SidebarNavigationSimple
                activeUrl={pathname}
                items={navItems}
                account={account}
                onSignOut={() => void signOut()}
                showAccountCard={Boolean(account)}
                isCollapsed={isCollapsed}
                onToggleCollapse={toggleCollapse}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-secondary bg-primary/80 px-4 backdrop-blur-md sm:h-16 lg:px-8">
                    <h1 className="truncate font-display text-lg font-medium tracking-tight text-primary sm:text-xl">{pageTitle}</h1>
                    <ThemeToggle />
                </header>

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
            </div>
        </div>
    );
}
