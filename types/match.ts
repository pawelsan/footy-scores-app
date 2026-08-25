export type MatchPlayer = {
	name: string;
	number: number;
	position: string;
};

export type MatchLineup = {
	team: string;
	formation: string;
	coach: string;
	startingXI: MatchPlayer[];
	bench: MatchPlayer[];
};

export type MatchScorer = {
	team: string;
	player: string;
	minute: number;
	type: string;
	assist?: string;
};

export type Match = {
	competition: {
		name: string;
		season: string;
		round: string;
	};
	venue: {
		name: string;
		city: string;
	};
	kickoff: string;
	status: string;
	teams: {
		home: string;
		away: string;
	};
	score: {
		home: number;
		away: number;
		halfTime: {
			home: number;
			away: number;
		};
	};
	scorers: MatchScorer[];
	lineups: {
		home: MatchLineup;
		away: MatchLineup;
	};
};
