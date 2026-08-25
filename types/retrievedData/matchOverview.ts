export type MatchOverview = {
	code: string;
	order: number;
	unitNum: string;
	startDate: string;
	endDate: string;
	hideStartDate: boolean;
	start: MatchOverviewStartEntry[];
	status: MatchOverviewStatus;
	venue: MatchOverviewVenue;
	location: MatchOverviewLocation;
	result: MatchOverviewResult;
};

export type MatchOverviewStartEntry = {
	sortOrder: number;
	startOrder: number;
	teamCode: string;
	participant: MatchOverviewParticipant;
};

export type MatchOverviewParticipant = {
	__typename: 'Team';
	code: string;
	name: string;
	shortName: string;
	teamType: string;
	organisation: MatchOverviewOrganisation;
};

export type MatchOverviewOrganisation = {
	code: string;
	description: string;
	longDescription: string;
};

export type MatchOverviewStatus = {
	code: string;
	description: string;
};

export type MatchOverviewVenue = {
	isCompetition: boolean;
	inOutDoor: string;
	description: string;
	longDescription: string;
};

export type MatchOverviewLocation = {
	locationOrder: number;
	description: string;
	longDescription: string;
	shortDescription: string;
};

export type MatchOverviewResult = {
	status: MatchOverviewStatus;
};
