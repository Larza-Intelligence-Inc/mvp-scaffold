"use client";

import type { FC, HTMLAttributes } from "react";
import { useCallback, useEffect, useRef } from "react";
import type { Placement } from "@react-types/overlays";
import { ChevronSelectorVertical, LogOut01, Settings01, User01 } from "@untitledui/icons";
import { useFocusManager } from "react-aria";
import type { DialogProps as AriaDialogProps } from "react-aria-components";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Link as AriaLink, Popover as AriaPopover } from "react-aria-components";
import { Avatar } from "@/components/base/avatar/avatar";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { cx } from "@/utils/cx";

export type NavAccountType = {
    /** Unique identifier for the nav item. */
    id: string;
    /** Name of the account holder. */
    name: string;
    /** Email address of the account holder. */
    email: string;
    /** Avatar image URL. */
    avatar: string;
    /** Online status of the account holder. This is used to display the online status indicator. */
    status: "online" | "offline";
};

export const NavAccountMenu = ({
    className,
    selectedAccountId = "olivia",
    onSignOut,
    ...dialogProps
}: AriaDialogProps & {
    className?: string;
    accounts?: NavAccountType[];
    selectedAccountId?: string;
    onSignOut?: () => void;
}) => {
    const focusManager = useFocusManager();
    const dialogRef = useRef<HTMLDivElement>(null);

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    focusManager?.focusNext({ tabbable: true, wrap: true });
                    break;
                case "ArrowUp":
                    focusManager?.focusPrevious({ tabbable: true, wrap: true });
                    break;
            }
        },
        [focusManager],
    );

    useEffect(() => {
        const element = dialogRef.current;
        if (element) {
            element.addEventListener("keydown", onKeyDown);
        }

        return () => {
            if (element) {
                element.removeEventListener("keydown", onKeyDown);
            }
        };
    }, [onKeyDown]);

    return (
        <AriaDialog
            {...dialogProps}
            ref={dialogRef}
            className={cx("w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden", className)}
        >
            <div className="rounded-xl bg-primary ring-1 ring-secondary">
                <div className="flex flex-col gap-0.5 py-1.5">
                    <NavAccountCardMenuItem label="View profile" icon={User01} href="/dashboard/profile" />
                    <NavAccountCardMenuItem label="Account settings" icon={Settings01} href="/dashboard/settings" />
                </div>
            </div>

            <div className="pt-1 pb-1.5">
                <NavAccountCardMenuItem label="Sign out" icon={LogOut01} onClick={onSignOut} />
            </div>
        </AriaDialog>
    );
};

const NavAccountCardMenuItem = ({
    icon: Icon,
    label,
    shortcut,
    href,
    ...buttonProps
}: {
    icon?: FC<{ className?: string }>;
    label: string;
    shortcut?: string;
    href?: string;
} & HTMLAttributes<HTMLButtonElement>) => {
    const content = (
        <div
            className={cx(
                "flex w-full items-center justify-between gap-3 rounded-md p-2 group-hover/item:bg-primary_hover",
                "outline-focus-ring group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-2",
            )}
        >
            <div className="flex gap-2 text-sm font-semibold text-secondary group-hover/item:text-secondary_hover">
                {Icon && <Icon className="size-5 text-fg-quaternary group-hover/item:text-fg-quaternary_hover" />} {label}
            </div>

            {shortcut && (
                <kbd className="flex rounded px-1 py-px font-body text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset">{shortcut}</kbd>
            )}
        </div>
    );

    if (href) {
        return (
            <AriaLink href={href} className="group/item w-full cursor-pointer px-1.5 focus:outline-hidden">
                {content}
            </AriaLink>
        );
    }

    return (
        <button {...buttonProps} type="button" className={cx("group/item w-full cursor-pointer px-1.5 focus:outline-hidden", buttonProps.className)}>
            {content}
        </button>
    );
};

export const NavAccountCard = ({
    popoverPlacement,
    selectedAccountId = "caitlyn",
    items = [],
    avatarRounded,
    onSignOut,
    collapsed = false,
}: {
    popoverPlacement?: Placement;
    selectedAccountId?: string;
    items?: NavAccountType[];
    avatarRounded?: boolean;
    onSignOut?: () => void;
    /** Icon-only avatar trigger for a collapsed sidebar. */
    collapsed?: boolean;
}) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const isDesktop = useBreakpoint("lg");

    const selectedAccount = items.find((account) => account.id === selectedAccountId);

    if (!selectedAccount) {
        console.warn(`Account with ID ${selectedAccountId} not found in <NavAccountCard />`);
        return null;
    }

    if (collapsed) {
        return (
            <div ref={triggerRef} className="flex justify-center">
                <AriaDialogTrigger>
                    <AriaButton
                        aria-label="Account menu"
                        className="group relative inline-flex cursor-pointer rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <Avatar
                            size="md"
                            src={selectedAccount.avatar || undefined}
                            alt={selectedAccount.name}
                            initials={selectedAccount.name.slice(0, 2).toUpperCase()}
                            status={selectedAccount.status}
                        />
                    </AriaButton>
                    <AriaPopover
                        placement={popoverPlacement ?? "right bottom"}
                        triggerRef={triggerRef}
                        offset={8}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "origin-(--trigger-anchor-point) will-change-transform",
                                isEntering &&
                                    "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                                isExiting &&
                                    "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                            )
                        }
                    >
                        <NavAccountMenu selectedAccountId={selectedAccountId} accounts={items} onSignOut={onSignOut} />
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>
        );
    }

    return (
        <div ref={triggerRef} className="relative flex items-center gap-3 rounded-xl bg-primary p-3 ring-1 ring-secondary ring-inset">
            <AvatarLabelGroup
                size="md"
                src={selectedAccount.avatar}
                title={selectedAccount.name}
                subtitle={selectedAccount.email}
                status={selectedAccount.status}
                rounded={avatarRounded}
            />

            <AriaDialogTrigger>
                <AriaButton className="absolute top-2 right-2 flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover pressed:text-fg-quaternary_hover">
                    <ChevronSelectorVertical className="size-4 shrink-0 stroke-[2.25px]" />
                </AriaButton>
                <AriaPopover
                    placement={popoverPlacement ?? (isDesktop ? "right bottom" : "top right")}
                    triggerRef={triggerRef}
                    offset={8}
                    className={({ isEntering, isExiting }) =>
                        cx(
                            "origin-(--trigger-anchor-point) will-change-transform",
                            isEntering &&
                                "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                            isExiting &&
                                "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                        )
                    }
                >
                    <NavAccountMenu selectedAccountId={selectedAccountId} accounts={items} onSignOut={onSignOut} />
                </AriaPopover>
            </AriaDialogTrigger>
        </div>
    );
};
