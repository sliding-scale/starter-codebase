"use client";

import { Button } from "@my-better-t-app/ui/components/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const isDark =
		mounted &&
		(theme === "dark" || (theme === "system" && resolvedTheme === "dark"));

	const toggleTheme = () => {
		setTheme(isDark ? "light" : "dark");
	};

	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			onClick={toggleTheme}
			disabled={!mounted}
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
			className="relative transition-transform active:scale-95"
		>
			<Sun
				className={`h-[1.2rem] w-[1.2rem] transition-all ${
					isDark
						? "rotate-90 scale-0 opacity-0"
						: "rotate-0 scale-100 opacity-100"
				}`}
			/>
			<Moon
				className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
					isDark
						? "rotate-0 scale-100 opacity-100"
						: "-rotate-90 scale-0 opacity-0"
				}`}
			/>
			<span className="sr-only">Toggle light and dark mode</span>
		</Button>
	);
}
