"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { XIcon } from "lucide-react";

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogBackdrop({
	className,
	...props
}: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-backdrop"
			className={cn(
				"fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
				"data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
				"transition-opacity duration-200",
				className,
			)}
			{...props}
		/>
	);
}

type DialogContentProps = DialogPrimitive.Popup.Props & {
	showCloseButton?: boolean;
};

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: DialogContentProps) {
	return (
		<DialogPortal>
			<DialogBackdrop />
			<DialogPrimitive.Popup
				data-slot="dialog-content"
				className={cn(
					"fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2",
					"rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl",
					"data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
					"data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
					"transition-[opacity,transform,scale] duration-200 ease-out",
					className,
				)}
				{...props}
			>
				{children}
				{showCloseButton ? (
					<DialogPrimitive.Close
						data-slot="dialog-close"
						className={cn(
							"absolute top-4 right-4 inline-flex size-7 items-center justify-center rounded-md",
							"text-muted-foreground transition-colors",
							"hover:bg-accent hover:text-foreground",
							"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
						)}
						aria-label="Close"
					>
						<XIcon className="size-4" />
					</DialogPrimitive.Close>
				) : null}
			</DialogPrimitive.Popup>
		</DialogPortal>
	);
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn(
				"font-semibold text-foreground text-lg tracking-tight",
				className,
			)}
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: DialogPrimitive.Description.Props) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

export {
	Dialog,
	DialogBackdrop,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogPortal,
	DialogTitle,
	DialogTrigger,
};
