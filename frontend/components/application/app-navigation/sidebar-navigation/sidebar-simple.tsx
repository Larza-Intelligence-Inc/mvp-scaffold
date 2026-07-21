"use client";

import type { ReactNode } from "react";
import { LayoutLeft, SearchLg } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { LarzaLogo } from "@/components/foundations/logo/larza-logo";
import { LarzaLogoMinimal } from "@/components/foundations/logo/larza-logo-minimal";
import { cx } from "@/utils/cx";
import { MobileNavigationHeader } from "../base-components/mobile-header";
import { NavAccountCard, type NavAccountType } from "../base-components/nav-account-card";
import { NavButton } from "../base-components/nav-button";
import { NavItemBase } from "../base-components/nav-item";
import { NavList } from "../base-components/nav-list";
import type { NavItemType } from "../config";

const EXPANDED_WIDTH = 280;
const COLLAPSED_WIDTH = 72;

interface SidebarNavigationProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: NavItemType[];
    /** List of footer items to display. */
    footerItems?: NavItemType[];
    /** Feature card to display. */
    featureCard?: ReactNode;
    /** Whether to show the account card. */
    showAccountCard?: boolean;
    /** Whether to hide the right side border. */
    hideBorder?: boolean;
    /** Additional CSS classes to apply to the sidebar. */
    className?: string;
    /** Whether to round the account card avatar. */
    avatarRounded?: boolean;
    /** Account shown in the footer card. */
    account?: NavAccountType;
    /** Called when the user chooses Sign out from the account menu. */
    onSignOut?: () => void;
    /** Whether the desktop sidebar is collapsed to icons. */
    isCollapsed?: boolean;
    /** Toggle collapsed / expanded desktop sidebar. */
    onToggleCollapse?: () => void;
}

export const SidebarNavigationSimple = ({
    activeUrl,
    items,
    footerItems = [],
    featureCard,
    showAccountCard = true,
    hideBorder = false,
    className,
    account,
    onSignOut,
    isCollapsed = false,
    onToggleCollapse,
}: SidebarNavigationProps) => {
    const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

    const renderSidebar = (collapsed: boolean) => (
        <aside
            style={
                {
                    "--width": `${collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH}px`,
                } as React.CSSProperties
            }
            className={cx(
                "flex h-full w-full max-w-full flex-col justify-between overflow-auto bg-secondary pt-4 transition-[width] duration-200 ease-linear lg:w-(--width) lg:pt-5",
                !hideBorder && "border-secondary md:border-r",
                className,
            )}
        >
            <div className={cx("flex flex-col gap-5", collapsed ? "px-2 lg:px-2.5" : "px-4 lg:px-5")}>
                <div className={cx("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
                    {collapsed ? <LarzaLogoMinimal className="size-8" /> : <LarzaLogo className="h-8" />}
                    {!collapsed && onToggleCollapse ? (
                        <ButtonUtility
                            size="sm"
                            color="tertiary"
                            icon={LayoutLeft}
                            tooltip="Collapse sidebar"
                            onClick={onToggleCollapse}
                            className="max-lg:hidden"
                        />
                    ) : null}
                </div>

                {!collapsed ? (
                    <>
                        <Input size="md" aria-label="Search" placeholder="Search" icon={SearchLg} className="md:hidden" />
                        <Input shortcut size="sm" aria-label="Search" placeholder="Search" icon={SearchLg} className="max-md:hidden" />
                    </>
                ) : null}
            </div>

            {collapsed ? (
                <ul className="mt-5 flex flex-col items-center gap-0.5 px-2.5">
                    {items.map((item) =>
                        item.icon ? (
                            <li key={item.label}>
                                <NavButton current={activeUrl === item.href} href={item.href} label={item.label} icon={item.icon} />
                            </li>
                        ) : null,
                    )}
                </ul>
            ) : (
                <NavList activeUrl={activeUrl} items={items} />
            )}

            <div className={cx("mt-auto flex flex-col gap-3 py-4 lg:py-5", collapsed ? "px-2.5" : "px-4")}>
                {collapsed ? (
                    <>
                        {footerItems.length > 0 && (
                            <ul className="flex flex-col items-center gap-0.5">
                                {footerItems.map((item) =>
                                    item.icon ? (
                                        <li key={item.label}>
                                            <NavButton current={activeUrl === item.href} href={item.href} label={item.label} icon={item.icon} />
                                        </li>
                                    ) : null,
                                )}
                            </ul>
                        )}
                        {onToggleCollapse ? (
                            <div className="flex justify-center max-lg:hidden">
                                <ButtonUtility
                                    size="sm"
                                    color="tertiary"
                                    icon={LayoutLeft}
                                    tooltip="Expand sidebar"
                                    onClick={onToggleCollapse}
                                    className="rotate-180"
                                />
                            </div>
                        ) : null}
                        {showAccountCard && account ? (
                            <NavAccountCard selectedAccountId={account.id} items={[account]} onSignOut={onSignOut} collapsed />
                        ) : null}
                    </>
                ) : (
                    <>
                        {footerItems.length > 0 && (
                            <ul className="flex flex-col">
                                {footerItems.map((item) => (
                                    <li key={item.label} className="py-px">
                                        <NavItemBase badge={item.badge} icon={item.icon} href={item.href} type="link" current={item.href === activeUrl}>
                                            {item.label}
                                        </NavItemBase>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {featureCard}

                        {showAccountCard && account ? (
                            <NavAccountCard selectedAccountId={account.id} items={[account]} onSignOut={onSignOut} />
                        ) : null}
                    </>
                )}
            </div>
        </aside>
    );

    return (
        <>
            {/* Mobile always uses the expanded nav; collapse is a desktop affordance. */}
            <MobileNavigationHeader>{renderSidebar(false)}</MobileNavigationHeader>

            <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex">{renderSidebar(isCollapsed)}</div>

            <div
                style={{
                    paddingLeft: sidebarWidth,
                }}
                className="invisible hidden transition-[padding] duration-200 ease-linear lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"
            />
        </>
    );
};
