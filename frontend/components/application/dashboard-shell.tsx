"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell01, Building07, HomeLine, Settings01, Users01 } from "@untitledui/icons";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import type { NavAccountType } from "@/components/application/app-navigation/base-components/nav-account-card";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Avatar } from "@/components/base/avatar/avatar";
import { authClient } from "@/lib/auth-client";

const navItems = [
    { label: "Home", href: "/dashboard", icon: HomeLine },
    { label: "Organizations", href: "/dashboard#organizations", icon: Building07 },
    { label: "Members", href: "/dashboard#members", icon: Users01 },
    { label: "Settings", href: "/dashboard#settings", icon: Settings01 },
];

type DashboardShellProps = {
    children: ReactNode;
    title?: string;
    subtitle?: string;
};

export function DashboardShell({ children, title = "Home", subtitle }: DashboardShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = authClient.useSession();

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

    return (
        <div className="flex min-h-dvh flex-col bg-secondary lg:flex-row">
            <SidebarNavigationSimple
                activeUrl={pathname}
                items={navItems}
                account={account}
                onSignOut={() => void signOut()}
                showAccountCard={Boolean(account)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-secondary bg-primary/80 px-4 backdrop-blur-md lg:px-8">
                    <div className="min-w-0">
                        <p className="font-mono text-xs font-medium tracking-[0.08em] text-tertiary uppercase">Dashboard</p>
                        <h1 className="truncate font-display text-lg font-medium tracking-tight text-primary">{title}</h1>
                        {subtitle ? <p className="truncate text-sm text-tertiary">{subtitle}</p> : null}
                    </div>

                    <div className="flex items-center gap-2">
                        <ButtonUtility size="sm" color="tertiary" icon={Bell01} tooltip="Notifications" />
                        {account ? (
                            <Avatar size="md" src={account.avatar || undefined} alt={account.name} initials={account.name.slice(0, 2).toUpperCase()} />
                        ) : null}
                    </div>
                </header>

                <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
            </div>
        </div>
    );
}
