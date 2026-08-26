import { useState } from 'react';
import type { MatchOverview } from '@/types/retrievedData/matchOverview';
import {
	getDisplayCode,
	getMatchDayAndTime,
	getParticipantNames,
	getRowBackgroundClass,
	getStageKey,
	type KnownStage,
	type StageLegendItem,
} from './helpers';
import TableControls from './TableControls';

type SectionProps = {
	title: string;
	sectionSchedules: MatchOverview[];
	legendItems: StageLegendItem[];
	defaultVisibleStages: KnownStage[];
};

export default function Table({
	title,
	sectionSchedules,
	legendItems,
	defaultVisibleStages,
}: SectionProps) {
	const [visibleStages, setVisibleStages] =
		useState<KnownStage[]>(defaultVisibleStages);

	const toggleVisibleStage = (stage: KnownStage, isChecked: boolean) => {
		setVisibleStages((current) => {
			if (isChecked) {
				if (current.includes(stage)) {
					return current;
				}

				return [...current, stage];
			}

			return current.filter((item) => item !== stage);
		});
	};

	return (
		<section className="mx-auto w-full max-w-3xl">
			<h2 className="mb-2 text-xl font-semibold">{title}</h2>
			<TableControls
				legendItems={legendItems}
				visibleStages={visibleStages}
				onToggleStage={toggleVisibleStage}
				onToggleAll={(isChecked) =>
					setVisibleStages(
						isChecked ? legendItems.map((item) => item.stage) : [],
					)
				}
			/>
			<div className="overflow-x-auto rounded-md border border-gray-200">
				<table className="w-full min-w-125 border-collapse text-left text-sm">
					<thead className="bg-gray-100">
						<tr>
							<th className="px-4 py-3 font-semibold">Code</th>
							<th className="px-4 py-3 font-semibold">Match day and time</th>
							<th className="px-4 py-3 font-semibold">Participants</th>
						</tr>
					</thead>
					<tbody>
						{sectionSchedules
							.filter((schedule) => {
								const stage = getStageKey(schedule.code);
								return stage === '' || visibleStages.includes(stage);
							})
							.map((schedule) => (
								<tr
									key={schedule.code}
									className={`border-t border-gray-200 ${getRowBackgroundClass(schedule.code)}`}
								>
									<td className="px-4 py-3 font-mono">
										{getDisplayCode(schedule.code)}
									</td>
									<td className="px-4 py-3">
										{getMatchDayAndTime(schedule.startDate)}
									</td>
									<td className="px-4 py-3">{getParticipantNames(schedule)}</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
		</section>
	);
}
