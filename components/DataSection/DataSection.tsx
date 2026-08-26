import { useState } from 'react';
import type { MatchOverview } from '@/types/retrievedData/matchOverview';
import {
	EXCLUDED_CODE_PART,
	WOMEN_CODE_PREFIX,
	sortByStartDate,
	womenLegendItems,
	womenDefaultVisibleStages,
	menLegendItems,
	menDefaultVisibleStages,
} from './helpers';
import Table from './Table';

type TableProps = {
	schedules: MatchOverview[];
	isLoading: boolean;
	error?: string | null;
};

type TabKey = 'women' | 'men';

export default function DataSection({
	schedules,
	isLoading,
	error,
}: TableProps) {
	const [activeTab, setActiveTab] = useState<TabKey>('women');

	if (isLoading) {
		return <p className="text-sm text-gray-600">Loading data...</p>;
	}

	if (error) {
		return <p className="text-sm text-red-600">{error}</p>;
	}

	if (schedules.length === 0) {
		return <p className="text-sm text-gray-600">No data</p>;
	}

	const filteredSchedules = schedules.filter(
		(schedule) => !schedule.code.includes(EXCLUDED_CODE_PART),
	);

	const womenSchedules = sortByStartDate(
		filteredSchedules.filter((schedule) =>
			schedule.code.startsWith(WOMEN_CODE_PREFIX),
		),
	);
	const menSchedules = sortByStartDate(
		filteredSchedules.filter(
			(schedule) => !schedule.code.startsWith(WOMEN_CODE_PREFIX),
		),
	);

	const womenTitle = "Women's football tournament";
	const menTitle = "Men's football tournament";

	const getTabClassName = (tab: TabKey): string => {
		const baseClassName =
			'rounded-t-md border border-b-0 px-4 py-2 text-sm font-semibold';

		if (tab === activeTab) {
			return `${baseClassName} bg-white text-black`;
		}

		return `${baseClassName} bg-gray-100 text-gray-600 hover:bg-gray-200`;
	};

	return (
		<div className="flex w-full flex-col items-center gap-0">
			<div className="flex w-full max-w-3xl items-end gap-2 border-b border-gray-200">
				<button
					type="button"
					onClick={() => setActiveTab('women')}
					className={getTabClassName('women')}
				>
					{womenTitle}
				</button>
				<button
					type="button"
					onClick={() => setActiveTab('men')}
					className={getTabClassName('men')}
				>
					{menTitle}
				</button>
			</div>
			<div
				className={`w-full justify-center pt-4 ${activeTab === 'women' ? 'flex' : 'hidden'}`}
			>
				<Table
					title={womenTitle}
					sectionSchedules={womenSchedules}
					legendItems={womenLegendItems}
					defaultVisibleStages={womenDefaultVisibleStages}
				/>
			</div>
			<div
				className={`w-full justify-center pt-4 ${activeTab === 'men' ? 'flex' : 'hidden'}`}
			>
				<Table
					title={menTitle}
					sectionSchedules={menSchedules}
					legendItems={menLegendItems}
					defaultVisibleStages={menDefaultVisibleStages}
				/>
			</div>
		</div>
	);
}
