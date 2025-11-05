import PropTypes from "prop-types";

const NAV_ITEMS = [
	{
		id: "live-monitoring",
		label: "Live Monitoring",
		description: "Real-time AQI feed and hazard alerts",
	},
	{
		id: "historical-trends",
		label: "Historical Trends",
		description: "24h, 7d, 30d comparative analytics",
	},
	{
		id: "pollutant-intel",
		label: "Pollutant Intelligence",
		description: "Dominant pollutants and attribution",
	},
	{
		id: "heatmap",
		label: "Heatmap",
		description: "Nationwide hotspot visualization",
	},
	{
		id: "reports",
		label: "Export & Reporting",
		description: "Download CSV or schedule briefs",
	},
	{
		id: "incidents",
		label: "Incident Desk",
		description: "Track and respond to air quality incidents",
	},
];

export const GovernmentLayout = ({
	badge = "Verified Government Access",
	title,
	description,
	headerActions,
	children,
}) => (
	<div className="min-h-screen bg-gradient-to-br from-gov-muted via-white to-gov-muted py-16">
		<div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 lg:flex-row lg:gap-12">
			<aside className="glass-panel flex w-full flex-col gap-8 p-8 lg:max-w-xs">
				<div className="space-y-3">
					<span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-gov-accent">
						<span className="block h-2 w-2 rounded-full bg-gov-accent animate-pulse" />
						Command Deck
					</span>
					<h2 className="text-2xl font-semibold text-gov-primary">
						National Environment Mission
					</h2>
					<p className="text-sm text-slate-500">
						Navigate intelligence modules curated for government analysts. Each
						panel surfaces policy-ready insights and response workflows.
					</p>
				</div>

				<nav
					className="flex flex-col gap-3"
					aria-label="Government portal navigation"
				>
					{NAV_ITEMS.map((item) => (
						<a
							key={item.id}
							href={`#${item.id}`}
							className="group rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3 transition hover:border-gov-accent/60 hover:bg-white"
						>
							<span className="flex items-center justify-between">
								<span className="text-sm font-semibold text-slate-700 group-hover:text-gov-primary">
									{item.label}
								</span>
								<span className="rounded-full bg-gov-accent/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gov-accent">
									View
								</span>
							</span>
							<span className="mt-2 block text-xs text-slate-500">
								{item.description}
							</span>
						</a>
					))}
				</nav>

				<div className="rounded-2xl bg-gov-primary/10 p-5 text-sm text-gov-primary">
					<p className="font-semibold">Need deeper access?</p>
					<p className="mt-1 text-slate-600">
						Contact the central operations desk to enable cross-jurisdiction data
						sharing and automated reporting workflows.
					</p>
				</div>
			</aside>

			<main id="main-content" tabIndex="-1" className="flex-1 space-y-6">
				<header className="glass-panel p-10">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.35em] text-gov-accent">
								<span className="block h-2 w-2 rounded-full bg-gov-accent animate-pulse" />
								{badge}
							</span>
							<h1 className="mt-4 text-3xl font-semibold text-gov-primary">
								{title}
							</h1>
							<p className="mt-4 max-w-2xl text-slate-600">{description}</p>
						</div>
						{headerActions}
					</div>
				</header>

				{children}
			</main>
		</div>
	</div>
);

GovernmentLayout.propTypes = {
	badge: PropTypes.string,
	title: PropTypes.string.isRequired,
	description: PropTypes.string.isRequired,
	headerActions: PropTypes.node,
	children: PropTypes.node,
};

GovernmentLayout.defaultProps = {
	headerActions: null,
};