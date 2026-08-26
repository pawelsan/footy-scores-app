import type { ScheduleListResponse } from '@/types/retrievedData/startList';

const SCHEDULE_LIST_URL =
	'https://stacy.olympics.com/OG2024/data/SCH_StartList~comp=OG2024~disc=FBL~lang=ENG.json';

export const fetchFootballScheduleList =
	async (): Promise<ScheduleListResponse> => {
		const response = await fetch(SCHEDULE_LIST_URL);

		if (!response.ok) {
			throw new Error(
				`Failed to load schedule list. Status: ${response.status}`,
			);
		}

		const data = (await response.json()) as ScheduleListResponse;
		return data;
	};
