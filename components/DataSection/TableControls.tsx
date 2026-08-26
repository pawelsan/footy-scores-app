import type { KnownStage, StageLegendItem } from './helpers';

type TableControlsProps = {
	legendItems: StageLegendItem[];
	visibleStages: KnownStage[];
	onToggleStage: (stage: KnownStage, isChecked: boolean) => void;
	onToggleAll: (isChecked: boolean) => void;
};

export default function TableControls({
	legendItems,
	visibleStages,
	onToggleStage,
	onToggleAll,
}: TableControlsProps) {
	const allLegendStages = legendItems.map((item) => item.stage);
	const isCheckAllChecked = allLegendStages.every((stage) =>
		visibleStages.includes(stage),
	);

	return (
		<p className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-700">
			{legendItems.map((item) => {
				const isVisible = visibleStages.includes(item.stage);

				return (
					<label
						key={item.label}
						className="inline-flex cursor-pointer items-center gap-2"
					>
						<input
							type="checkbox"
							checked={isVisible}
							onChange={(event) =>
								onToggleStage(item.stage, event.target.checked)
							}
							className="sr-only"
						/>
						<span
							className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${isVisible ? 'border-gray-700' : 'border-gray-300'} ${item.colorClass}`}
						>
							{isVisible ? (
								<span className="text-[10px] font-bold">✓</span>
							) : null}
						</span>
						<span>: {item.label}</span>
					</label>
				);
			})}
			<label className="inline-flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					checked={isCheckAllChecked}
					onChange={(event) => onToggleAll(event.target.checked)}
					className="sr-only"
				/>
				<span
					className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border ${isCheckAllChecked ? 'border-gray-700' : 'border-gray-300'} bg-white`}
				>
					{isCheckAllChecked ? (
						<span className="text-[10px] font-bold">✓</span>
					) : null}
				</span>
				<span>: Check all</span>
			</label>
		</p>
	);
}
