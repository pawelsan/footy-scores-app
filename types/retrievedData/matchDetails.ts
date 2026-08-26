interface EventUnitEntry {
	eue_code: string;
	eue_value: string;
}

export interface TeamAthletes {
	bib: string;
	participantCode: string;
	athlete: {
		givenName: string;
		familyName: string;
	};
	eventUnitEntries: EventUnitEntry[];
}

interface TeamCoaches {
	function: {
		functionCode: string;
	};
	coach: {
		familyName: string;
		givenName: string;
	};
}
interface Participant {
	code: string;
	name: string;
}

export interface Item {
	eventUnitEntries: EventUnitEntry[];
	participant: Participant;
	teamAthletes: TeamAthletes[];
	teamCoaches: TeamCoaches[];
}

export interface Action {
	pbpa_order: number;
	pbpa_Action: string;
	pbpa_When?: string;
	pbpa_Result?: string;
	competitors: {
		pbpc_code: string;
		athletes: {
			pbpat_code: string;
			pbpat_bib: string;
			pbpat_role: string;
		}[];
	}[];
}

interface PlayByPlayItem {
	actions: Action[];
}

interface PeriodSide {
	score: string;
}

export interface Period {
	p_code: string;
	home: PeriodSide;
	away: PeriodSide;
}

interface Results {
	items?: Item[];
	playByPlay?: PlayByPlayItem[];
	eventUnit?: {
		description: string;
	};
	periods?: Period[];
	schedule?: {
		startDate: string;
		status: {
			code: string;
		};
		venue: {
			description: string;
		};
		location: {
			description: string;
		};
	};
}

export interface Data {
	results: Results;
}
