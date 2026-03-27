export default function MarketingLoading() {
	return (
		<div className="space-y-6 animate-pulse">
			<div className="h-10 w-1/3 rounded-xl bg-muted/60" />

			<div className="grid grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className="h-24 rounded-xl bg-muted/60"
					/>
				))}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div className="h-64 rounded-xl bg-muted/60" />
				<div className="h-64 rounded-xl bg-muted/60" />
			</div>
		</div>
	);
}
