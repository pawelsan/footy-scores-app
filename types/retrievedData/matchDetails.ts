export interface EventUnitEntry {
	eue_code: string;
	eue_type: string;
	eue_value: string;
	eue_pos?: string;
}

export interface TeamAthletes {
	bib: string;
	athlete: {
		givenName: string;
		familyName: string;
	};
	eventUnitEntries: EventUnitEntry[];
}

export interface TeamCoaches {
	function: {
		functionCode: string;
		description: string;
	};
	coach: {
		familyName: string;
		givenName: string;
	};
}

export interface Participant {
	name: string;
}

export interface Item {
	eventUnitEntries: EventUnitEntry[];
	participant: Participant;
	teamAthletes: TeamAthletes[];
	teamCoaches: TeamCoaches[];
}

export interface Action {
	pbpa_period: string;
	pbpa_id: string;
	pbpa_order: number;
	pbpa_Action: string;
	pbpa_When: string;
	pbpa_Result?: string;
	pbpa_ScoreH?: string;
	pbpa_ScoreA?: string;
	competitors: {
		pbpc_code: string;
		pbpc_order: number;
		pbpc_type: string;
		athletes: {
			pbpat_code: string;
			pbpat_order: string;
			pbpat_bib: string;
			pbpat_role: string;
		}[];
	}[];
}

export interface PlayByPlayItem {
	actions: Action[];
}

export interface Results {
	items: Item[];
	playByPlay: PlayByPlayItem[];
	eventUnit: {
		description: string;
		longDescription: string;
		shortDescription: string;
	};
	schedule: {
		startDate: string;
		endDate: string;
		location: {
			description: string;
			longDescription: string;
			shortDescription: string;
		};
	};
}

export interface Data {
	results: Results;
}
