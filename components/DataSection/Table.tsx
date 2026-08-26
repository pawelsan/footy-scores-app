import { useState } from 'react';
import type { MatchOverview } from '@/types/retrievedData/matchOverview';
import type { MatchResponse } from '@/types/match';
import {
	MATCH_DETAILS_API_PREFIX,
	getDisplayCode,
	getMatchDayAndTime,
	getParticipantNames,
	getRowBackgroundClass,
	getStageKey,
	type KnownStage,
	type StageLegendItem,
} from './helpers';
import MatchDetailsModal, { type MatchDetailsState } from './MatchDetailsModal';
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
	const [detailsState, setDetailsState] = useState<MatchDetailsState>({
		status: 'CLOSED',
	});

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

	const closeDetailsModal = () => {
		setDetailsState({ status: 'CLOSED' });
	};

	const openDetailsModal = async (code: string) => {
		setDetailsState({ status: 'LOADING', selectedCode: code });

		try {
			const response = await fetch(
				`${MATCH_DETAILS_API_PREFIX}${encodeURIComponent(code)}`,
			);

			if (!response.ok) {
				const errorPayload = (await response.json()) as { error?: string };
				throw new Error(
					errorPayload.error ??
						`Failed to fetch details. Status: ${response.status}`,
				);
			}

			const payload = (await response.json()) as MatchResponse;
			setDetailsState({
				status: 'SUCCESS',
				selectedCode: code,
				selectedMatch: payload,
			});
		} catch (error) {
			setDetailsState({
				status: 'ERROR',
				selectedCode: code,
				error:
					error instanceof Error
						? error.message
						: 'Failed to load match details.',
			});
		}
	};

	return (
		<section className="w-full">
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
							<th className="px-4 py-3 font-semibold">Endpoint</th>
							<th className="px-4 py-3 font-semibold">Actions</th>
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
									<td className="px-4 py-3 font-mono text-xs">
										{`${MATCH_DETAILS_API_PREFIX}${schedule.code}`}
									</td>
									<td className="px-4 py-3">
										<button
											type="button"
											onClick={() => openDetailsModal(schedule.code)}
											className="text-blue-700 underline hover:text-blue-900"
										>
											See JSON
										</button>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
			<MatchDetailsModal
				detailsState={detailsState}
				onClose={closeDetailsModal}
			/>
		</section>
	);
}
