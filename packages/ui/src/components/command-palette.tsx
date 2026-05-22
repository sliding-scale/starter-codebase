"use client";

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandShortcut,
} from "@my-better-t-app/ui/components/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@my-better-t-app/ui/components/dialog";
import { Search } from "lucide-react";
import * as React from "react";

/** A single selectable command in the palette. */
export type CommandPaletteItem = {
	/** Stable id used by cmdk for filtering. Must be unique within the palette. */
	id: string;
	/** Visible label and what users search against. */
	label: string;
	/** Optional one-line description shown next to the label. */
	description?: string;
	/** Optional leading icon. */
	icon?: React.ComponentType<{ className?: string }>;
	/** Optional trailing keyboard hint (e.g. "G H"). */
	shortcut?: string;
	/** Additional searchable keywords beyond the label. */
	keywords?: string[];
	/** Called when the user picks this item. Palette closes automatically after. */
	onSelect: () => void;
	/** Renders the item disabled. */
	disabled?: boolean;
};

export type CommandPaletteGroup = {
	/** Section heading shown above the items. */
	heading: string;
	items: CommandPaletteItem[];
};

type Props = {
	/** Controlled open state. */
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Command groups, rendered in order. Designed to be extended over time. */
	groups: CommandPaletteGroup[];
	/** Placeholder text in the search input. */
	placeholder?: string;
};

/** Stateless command palette. For the global ⌘K shortcut use {@link CommandPaletteRoot}. */
export function CommandPalette({
	open,
	onOpenChange,
	groups,
	placeholder = "Type a command or search…",
}: Props) {
	const visibleGroups = groups.filter((g) => g.items.length > 0);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="max-w-xl overflow-hidden p-0"
			>
				{/* Hidden labels for accessibility — base-ui Dialog announces them. */}
				<DialogTitle className="sr-only">Command palette</DialogTitle>
				<DialogDescription className="sr-only">
					Search and run commands. Use the arrow keys to navigate.
				</DialogDescription>

				<Command label="Command palette">
					<CommandInput placeholder={placeholder} autoFocus />
					<CommandList>
						<CommandEmpty>
							<Search className="size-4 text-muted-foreground" aria-hidden />
							<span>No matches found.</span>
						</CommandEmpty>

						{visibleGroups.map((group) => (
							<CommandGroup key={group.heading} heading={group.heading}>
								{group.items.map((item) => {
									const Icon = item.icon;
									return (
										<CommandItem
											key={item.id}
											value={`${item.label} ${(item.keywords ?? []).join(" ")}`}
											disabled={item.disabled}
											onSelect={() => {
												if (item.disabled) return;
												item.onSelect();
												onOpenChange(false);
											}}
										>
											{Icon ? <Icon className="size-4" /> : null}
											<span className="flex-1 truncate">{item.label}</span>
											{item.description ? (
												<span className="truncate text-muted-foreground text-xs">
													{item.description}
												</span>
											) : null}
											{item.shortcut ? (
												<CommandShortcut>{item.shortcut}</CommandShortcut>
											) : null}
										</CommandItem>
									);
								})}
							</CommandGroup>
						))}
					</CommandList>
				</Command>
			</DialogContent>
		</Dialog>
	);
}

type RootProps = {
	/** Groups of commands to show. Wire navigation + future actions here. */
	groups: CommandPaletteGroup[];
	/** Custom placeholder for the search input. */
	placeholder?: string;
};

/**
 * Wires up the global ⌘K / Ctrl+K shortcut and renders the palette. Mount once
 * per app (e.g. inside the app shell). Ignores keypresses while a text input
 * is focused, except for the modifier-combo itself.
 */
export function CommandPaletteRoot({ groups, placeholder }: RootProps) {
	const [open, setOpen] = React.useState(false);

	React.useEffect(() => {
		function onKeyDown(e: KeyboardEvent) {
			const isToggle = e.key === "k" && (e.metaKey || e.ctrlKey);
			if (!isToggle) return;
			e.preventDefault();
			setOpen((prev) => !prev);
		}
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<CommandPalette
			open={open}
			onOpenChange={setOpen}
			groups={groups}
			placeholder={placeholder}
		/>
	);
}

export default CommandPaletteRoot;
