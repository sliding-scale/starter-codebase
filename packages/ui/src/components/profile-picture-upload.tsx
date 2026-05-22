"use client";

import { api } from "@my-better-t-app/backend/convex/_generated/api";
import { Button } from "@my-better-t-app/ui/components/button";
import { Skeleton } from "@my-better-t-app/ui/components/skeleton";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { Camera, Loader2, Trash2, User as UserIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

type Props = {
	currentUrl?: string | null;
	/** Display name fallback initial when no picture is set. */
	name: string;
	isLoading?: boolean;
};

export function ProfilePictureUpload({
	currentUrl,
	name,
	isLoading = false,
}: Props) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const [removing, setRemoving] = useState(false);

	const generateUploadUrl = useMutation(
		api.user.mutations.generateProfilePictureUploadUrl,
	);
	const setProfilePicture = useMutation(api.user.mutations.setProfilePicture);
	const removeProfilePicture = useMutation(
		api.user.mutations.removeProfilePicture,
	);

	const onPick = () => inputRef.current?.click();

	const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = ""; // allow re-picking the same file
		if (!file) return;

		if (!ACCEPTED.includes(file.type)) {
			toast.error("Use a PNG, JPEG, or WebP image.");
			return;
		}
		if (file.size > MAX_BYTES) {
			toast.error("Image must be 5 MB or smaller.");
			return;
		}

		setUploading(true);
		try {
			const uploadUrl = await generateUploadUrl();
			const res = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});
			if (!res.ok) throw new Error(`Upload failed (${res.status})`);
			const { storageId } = (await res.json()) as { storageId: string };
			await setProfilePicture({ storageId: storageId as never });
			toast.success("Profile picture updated.");
		} catch (err) {
			const msg =
				err instanceof ConvexError &&
				typeof err.data === "object" &&
				err.data !== null &&
				"message" in err.data
					? String((err.data as { message: string }).message)
					: err instanceof Error
						? err.message
						: "Upload failed.";
			toast.error(msg);
		} finally {
			setUploading(false);
		}
	};

	const onRemove = async () => {
		setRemoving(true);
		try {
			await removeProfilePicture();
			toast.success("Profile picture removed.");
		} catch (err) {
			const msg =
				err instanceof ConvexError &&
				typeof err.data === "object" &&
				err.data !== null &&
				"message" in err.data
					? String((err.data as { message: string }).message)
					: "Could not remove.";
			toast.error(msg);
		} finally {
			setRemoving(false);
		}
	};

	const initial = name?.trim()?.[0]?.toUpperCase() ?? "";

	return (
		<div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
			<div className="relative">
				<div
					className={cn(
						"flex size-20 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-foreground/80",
						"transition-shadow",
						uploading || removing ? "opacity-70" : "hover:shadow-md",
					)}
				>
					{isLoading ? (
						<Skeleton className="size-full rounded-full" />
					) : currentUrl ? (
						<Image
							src={currentUrl}
							alt="Profile"
							width={80}
							height={80}
							unoptimized
							className="size-full object-cover"
						/>
					) : initial ? (
						<span className="font-heading font-semibold text-2xl tracking-tight">
							{initial}
						</span>
					) : (
						<UserIcon className="size-8" strokeWidth={1.5} aria-hidden />
					)}
				</div>
				{(uploading || removing) && (
					<div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm">
						<Loader2
							className="size-5 animate-spin text-muted-foreground"
							aria-hidden
						/>
					</div>
				)}
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<input
					ref={inputRef}
					type="file"
					accept={ACCEPTED.join(",")}
					onChange={onFileChange}
					className="hidden"
				/>
				<Button
					type="button"
					variant="outline"
					onClick={onPick}
					disabled={uploading || removing}
					className="transition-transform active:scale-[0.98]"
				>
					<Camera className="size-4" aria-hidden />
					{currentUrl ? "Change" : "Upload"}
				</Button>
				{currentUrl ? (
					<Button
						type="button"
						variant="ghost"
						onClick={onRemove}
						disabled={uploading || removing}
						className="text-muted-foreground transition-colors hover:text-destructive"
					>
						<Trash2 className="size-4" aria-hidden />
						Remove
					</Button>
				) : null}
				<p className="basis-full text-muted-foreground text-xs">
					PNG, JPEG or WebP. Max 5 MB.
				</p>
			</div>
		</div>
	);
}

export default ProfilePictureUpload;
