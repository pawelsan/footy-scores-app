interface MatchOverviewStartEntry {
	participant?: {
		name?: string;
	};
}

export interface MatchOverview {
	code: string;
	startDate: string;
	start?: MatchOverviewStartEntry[];
}

export interface ScheduleListResponse {
	schedules: MatchOverview[];
}
