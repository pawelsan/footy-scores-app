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

type ExportState =
	| { status: 'IDLE' }
	| { status: 'PENDING' }
	| { status: 'ERROR'; error: string };

export default function Table({
	title,
	sectionSchedules,
	legendItems,
	defaultVisibleStages,
}: SectionProps) {
	const [visibleStages, setVisibleStages] =
		useState<KnownStage[]>(defaultVisibleStages);
	const [exportState, setExportState] = useState<ExportState>({
		status: 'IDLE',
	});
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

	const downloadJsonFile = (filename: string, payload: unknown) => {
		const blob = new Blob([JSON.stringify(payload, null, 2)], {
			type: 'application/json',
		});
		const objectUrl = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = objectUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(objectUrl);
	};

	const handleExportJson = async () => {
		setExportState({ status: 'PENDING' });

		try {
			const entries = await Promise.all(
				sectionSchedules.map(async (schedule) => {
					const endpointKey = `${MATCH_DETAILS_API_PREFIX}${schedule.code}`;
					const response = await fetch(
						`${MATCH_DETAILS_API_PREFIX}${encodeURIComponent(schedule.code)}`,
					);

					if (!response.ok) {
						let message = `Failed to fetch ${schedule.code}. Status: ${response.status}`;

						try {
							const errorPayload = (await response.json()) as {
								error?: string;
							};
							if (errorPayload.error) {
								message = errorPayload.error;
							}
						} catch {
							// Keep fallback message if the error payload is not JSON.
						}

						throw new Error(message);
					}

					const payload = (await response.json()) as MatchResponse;
					return [endpointKey, payload] as const;
				}),
			);

			const exportPayload = Object.fromEntries(entries) as Record<
				string,
				MatchResponse
			>;
			const safeTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
			downloadJsonFile(`${safeTitle}-matches.json`, exportPayload);
			setExportState({ status: 'IDLE' });
		} catch (error) {
			setExportState({
				status: 'ERROR',
				error:
					error instanceof Error
						? error.message
						: 'Failed to export match data as JSON.',
			});
		}
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
			<div className="mb-3 flex items-center gap-3">
				<button
					type="button"
					onClick={handleExportJson}
					disabled={
						exportState.status === 'PENDING' || sectionSchedules.length === 0
					}
					className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
				>
					{exportState.status === 'PENDING' ? 'Exporting...' : 'Export JSON'}
				</button>
				{exportState.status === 'ERROR' ? (
					<p className="text-sm text-red-600">{exportState.error}</p>
				) : null}
			</div>
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
