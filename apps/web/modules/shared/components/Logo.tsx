import { cn } from "@ui/lib";

export function Logo({
	withLabel = true,
	className,
}: {
	className?: string;
	withLabel?: boolean;
}) {
	return (
		<span
			className={cn(
				"flex items-center font-semibold text-foreground leading-none",
				className,
			)}
		>
			<span className="text-lg">✦</span>
			{withLabel && (
				<span className="ml-2 text-xl font-bold tracking-tight">PilotSocials</span>
			)}
		</span>
	);
}
