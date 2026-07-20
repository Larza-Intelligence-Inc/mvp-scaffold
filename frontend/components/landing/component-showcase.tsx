"use client";

import { useState } from "react";
import type { Selection } from "react-aria-components";
import { Calendar, Check, HelpCircle, Mail01, Plus, SearchLg, Trash01 } from "@untitledui/icons";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Badge, BadgeWithDot, BadgeWithIcon } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { Input, InputBase } from "@/components/base/input/input";
import { InputDate } from "@/components/base/input/input-date";
import { InputFile } from "@/components/base/input/input-file";
import { InputGroup } from "@/components/base/input/input-group";
import { InputNumber } from "@/components/base/input/input-number";
import { PaymentInput } from "@/components/base/input/input-payment";
import { PinInput } from "@/components/base/input/pin-input";
import { Tag, TagGroup, TagList } from "@/components/base/tags/tags";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { VisaIcon, MastercardIcon, AmexIcon } from "@/components/foundations/payment-icons";

function Section({
    id,
    title,
    description,
    children,
}: {
    id: string;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="flex flex-col gap-5 scroll-mt-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                <p className="text-sm text-tertiary">{description}</p>
            </div>
            <div className="rounded-xl bg-primary p-5 shadow-xs ring-1 ring-secondary sm:p-6">{children}</div>
        </section>
    );
}

function ModalDemo() {
    return (
        <DialogTrigger>
            <Button color="primary" size="md">
                Open modal
            </Button>
            <ModalOverlay>
                <Modal className="w-full max-w-md">
                    <Dialog className="flex flex-col gap-4 p-6">
                        {({ close }) => (
                            <>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-lg font-semibold text-primary">Confirm action</h3>
                                    <p className="text-sm text-tertiary">
                                        This Untitled UI modal uses DialogTrigger, ModalOverlay, Modal, and Dialog.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 pt-2">
                                    <Button color="secondary" size="md" onPress={close}>
                                        Cancel
                                    </Button>
                                    <Button color="primary" size="md" onPress={close}>
                                        Confirm
                                    </Button>
                                </div>
                            </>
                        )}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
}

export function ComponentShowcase({ apiMessage }: { apiMessage: string }) {
    const [selectedTags, setSelectedTags] = useState<Selection>(new Set(["design"]));

    return (
        <div className="flex flex-col gap-12">
            <header className="flex flex-col gap-4">
                <Badge type="pill-color" color="brand" size="sm">
                    Untitled UI showcase
                </Badge>
                <div className="flex flex-col gap-2">
                    <h1 className="text-display-sm font-semibold text-primary">Component gallery</h1>
                    <p className="max-w-2xl text-md text-tertiary">
                        Major Untitled UI primitives available in this scaffold — buttons, badges, inputs, tags,
                        tooltips, and modals.
                    </p>
                </div>
                <div className="rounded-xl bg-secondary p-4 ring-1 ring-secondary">
                    <p className="text-md text-secondary">
                        <strong className="text-primary">API says:</strong> {apiMessage}
                    </p>
                </div>
                <nav className="flex flex-wrap gap-2">
                    {[
                        ["buttons", "Buttons"],
                        ["badges", "Badges"],
                        ["inputs", "Inputs"],
                        ["tags", "Tags"],
                        ["tooltips", "Tooltips"],
                        ["modals", "Modals"],
                        ["payment-icons", "Payment icons"],
                    ].map(([href, label]) => (
                        <Button key={href} color="secondary" size="sm" href={`#${href}`}>
                            {label}
                        </Button>
                    ))}
                </nav>
            </header>

            <Section id="buttons" title="Buttons" description="Primary actions across colors, sizes, icons, and states.">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button color="primary" size="md">
                            Primary
                        </Button>
                        <Button color="secondary" size="md">
                            Secondary
                        </Button>
                        <Button color="tertiary" size="md">
                            Tertiary
                        </Button>
                        <Button color="primary-destructive" size="md">
                            Destructive
                        </Button>
                        <Button color="link-color" size="md" href="https://www.untitledui.com/react">
                            Link button
                        </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button color="primary" size="sm" iconLeading={Plus}>
                            Add item
                        </Button>
                        <Button color="secondary" size="md" iconTrailing={Check}>
                            Done
                        </Button>
                        <Button color="secondary" size="md" iconLeading={SearchLg} aria-label="Search" />
                        <Button color="primary-destructive" size="md" iconLeading={Trash01}>
                            Delete
                        </Button>
                        <Button color="primary" size="md" isLoading>
                            Loading
                        </Button>
                        <Button color="secondary" size="md" isDisabled>
                            Disabled
                        </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button color="primary" size="sm">
                            Small
                        </Button>
                        <Button color="primary" size="md">
                            Medium
                        </Button>
                        <Button color="primary" size="lg">
                            Large
                        </Button>
                        <Button color="primary" size="xl">
                            Extra large
                        </Button>
                    </div>
                </div>
            </Section>

            <Section id="badges" title="Badges" description="Status labels, pills, and icon badges for metadata.">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge type="pill-color" color="gray" size="md">
                            Gray
                        </Badge>
                        <Badge type="pill-color" color="brand" size="md">
                            Brand
                        </Badge>
                        <Badge type="pill-color" color="error" size="md">
                            Error
                        </Badge>
                        <Badge type="pill-color" color="warning" size="md">
                            Warning
                        </Badge>
                        <Badge type="pill-color" color="success" size="md">
                            Success
                        </Badge>
                        <Badge type="pill-color" color="blue" size="md">
                            Blue
                        </Badge>
                        <Badge type="color" color="purple" size="md">
                            Color badge
                        </Badge>
                        <Badge type="modern" color="gray" size="md">
                            Modern
                        </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <BadgeWithDot type="pill-color" color="success" size="md">
                            Online
                        </BadgeWithDot>
                        <BadgeWithDot type="pill-color" color="warning" size="md">
                            Pending
                        </BadgeWithDot>
                        <BadgeWithDot type="pill-color" color="error" size="md">
                            Offline
                        </BadgeWithDot>
                        <BadgeWithIcon type="pill-color" color="brand" size="md" iconLeading={Check}>
                            Verified
                        </BadgeWithIcon>
                        <BadgeWithIcon type="pill-color" color="gray" size="md" iconLeading={Mail01}>
                            Inbox
                        </BadgeWithIcon>
                    </div>
                </div>
            </Section>

            <Section id="inputs" title="Inputs" description="Text, number, date, file, payment, group, and PIN fields.">
                <div className="grid gap-6 sm:grid-cols-2">
                    <Input label="Email" placeholder="you@example.com" hint="We'll never share your email." icon={Mail01} />
                    <Input label="Password" type="password" placeholder="••••••••" tooltip="Use at least 8 characters" />
                    <Input label="Search" placeholder="Search…" icon={SearchLg} shortcut="⌘K" />
                    <InputNumber label="Quantity" defaultValue={1} minValue={0} maxValue={99} hint="With stepper controls" />
                    <InputDate label="Start date" icon={Calendar} hint="Pick a date" />
                    <PaymentInput label="Card number" placeholder="Card number" hint="Try 4242 4242 4242 4242" />
                    <InputGroup label="Website" prefix="https://" hint="Domain without protocol">
                        <InputBase placeholder="example.com" />
                    </InputGroup>
                    <InputFile label="Attachment" hint="PNG, JPG, or PDF up to 10MB" buttonText="Upload" />
                    <div className="sm:col-span-2">
                        <PinInput size="xxxs">
                            <PinInput.Label>Verification code</PinInput.Label>
                            <PinInput.Group maxLength={4}>
                                <PinInput.Slot index={0} />
                                <PinInput.Slot index={1} />
                                <PinInput.Slot index={2} />
                                <PinInput.Slot index={3} />
                            </PinInput.Group>
                            <PinInput.Description>Enter the 4-digit code from your email.</PinInput.Description>
                        </PinInput>
                    </div>
                </div>
            </Section>

            <Section id="tags" title="Tags" description="Selectable and closable tags for filters and attributes.">
                <div className="flex flex-col gap-6">
                    <TagGroup label="Topics" selectionMode="multiple" selectedKeys={selectedTags} onSelectionChange={setSelectedTags} size="md">
                        <TagList className="flex flex-wrap gap-2">
                            <Tag id="design" dot>
                                Design
                            </Tag>
                            <Tag id="engineering" count={12}>
                                Engineering
                            </Tag>
                            <Tag id="product">Product</Tag>
                            <Tag id="marketing" isDisabled>
                                Marketing
                            </Tag>
                        </TagList>
                    </TagGroup>
                    <TagGroup label="Removable" size="md">
                        <TagList className="flex flex-wrap gap-2">
                            <Tag id="react" onClose={() => undefined}>
                                React
                            </Tag>
                            <Tag id="next" onClose={() => undefined}>
                                Next.js
                            </Tag>
                            <Tag id="hono" onClose={() => undefined}>
                                Hono
                            </Tag>
                        </TagList>
                    </TagGroup>
                </div>
            </Section>

            <Section id="tooltips" title="Tooltips" description="Contextual help on hover or focus.">
                <div className="flex flex-wrap items-center gap-4">
                    <Tooltip title="Quick tip" description="Tooltips support a title and optional description." arrow>
                        <TooltipTrigger>
                            <Button color="secondary" size="md" iconLeading={HelpCircle}>
                                Hover me
                            </Button>
                        </TooltipTrigger>
                    </Tooltip>
                    <Tooltip title="Top placement" placement="top">
                        <TooltipTrigger>
                            <Button color="tertiary" size="md">
                                Top
                            </Button>
                        </TooltipTrigger>
                    </Tooltip>
                    <Tooltip title="Bottom placement" placement="bottom">
                        <TooltipTrigger>
                            <Button color="tertiary" size="md">
                                Bottom
                            </Button>
                        </TooltipTrigger>
                    </Tooltip>
                </div>
            </Section>

            <Section id="modals" title="Modals" description="Dialog overlay for confirmations and focused flows.">
                <ModalDemo />
            </Section>

            <Section id="payment-icons" title="Payment icons" description="Brand marks used by payment inputs and checkout UIs.">
                <div className="flex flex-wrap items-center gap-4">
                    <VisaIcon className="h-8 w-12" />
                    <MastercardIcon className="h-8 w-12" />
                    <AmexIcon className="h-8 w-12" />
                </div>
            </Section>
        </div>
    );
}
