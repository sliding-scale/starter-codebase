"use client";

import { cn } from "@my-better-t-app/ui/lib/utils";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import type * as React from "react";

function Command({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive>) {
	return (
		<CommandPrimitive
			data-slot="command"
			className={cn(
				"flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CommandInput({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
	return (
		<div
			data-slot="command-input-wrapper"
			className="flex items-center gap-2 border-border border-b px-3"
		>
			<SearchIcon className="size-4 shrink-0 text-muted-foreground" />
			<CommandPrimitive.Input
				data-slot="command-input"
				className={cn(
					"flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none",
					"placeholder:text-muted-foreground",
					"disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				{...props}
			/>
		</div>
	);
}

function CommandList({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
	return (
		<CommandPrimitive.List
			data-slot="command-list"
			className={cn(
				"max-h-[360px] scroll-py-1 overflow-y-auto overflow-x-hidden p-1",
				className,
			)}
			{...props}
		/>
	);
}

function CommandEmpty({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
	return (
		<CommandPrimitive.Empty
			data-slot="command-empty"
			className={cn(
				"flex flex-col items-center justify-center gap-1 px-6 py-10 text-center text-muted-foreground text-sm",
				className,
			)}
			{...props}
		/>
	);
}

function CommandGroup({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
	return (
		<CommandPrimitive.Group
			data-slot="command-group"
			className={cn(
				"overflow-hidden p-1 text-foreground",
				"[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5",
				"[&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[11px]",
				"[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider",
				"[&_[cmdk-group-heading]]:text-muted-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CommandSeparator({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
	return (
		<CommandPrimitive.Separator
			data-slot="command-separator"
			className={cn("mx-1 my-1 h-px bg-border", className)}
			{...props}
		/>
	);
}

function CommandItem({
	className,
	...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
	return (
		<CommandPrimitive.Item
			data-slot="command-item"
			className={cn(
				"relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 text-sm outline-none",
				"transition-colors",
				"data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
				"data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
				"[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
				"data-[selected=true]:[&_svg]:text-accent-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function CommandShortcut({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="command-shortcut"
			className={cn(
				"ml-auto text-muted-foreground text-xs tracking-widest",
				className,
			)}
			{...props}
		/>
	);
}

export {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
};
