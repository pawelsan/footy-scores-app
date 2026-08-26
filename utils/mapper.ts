import type {
	Action,
	Data,
	Item,
	Period,
	TeamAthletes,
} from '../types/retrievedData/matchDetails';
import type { MatchResponse, MatchPlayer, MatchScorer } from '../types/match';

const HOME_AWAY_CODE = 'HOME_AWAY';
const FORMATION_CODE = 'FORMATION';
const STARTER_CODE = 'STARTER';
const POSITION_CODE = 'POSITION';
const HEAD_COACH_CODE = 'COACH';

const getItemSide = (item: Item): 'HOME' | 'AWAY' | undefined => {
	const side = item.eventUnitEntries.find(
		(entry) => entry.eue_code === HOME_AWAY_CODE,
	)?.eue_value;

	if (side === 'HOME' || side === 'AWAY') {
		return side;
	}

	return undefined;
};

const getItemBySide = (
	items: Item[],
	side: 'HOME' | 'AWAY',
): Item | undefined => {
	return items.find((item) => getItemSide(item) === side);
};

const getActionMinute = (action: Action): number => {
	const whenValue =
		typeof action.pbpa_When === 'string' ? action.pbpa_When : '';
	const base = whenValue.match(/\d+/);

	const baseMinute = base ? Number.parseInt(base[0], 10) : 0;
	// const added = whenValue.match(/\+\s*(\d+)/);
	// const addedMinute = added ? Number.parseInt(added[1], 10) : 0;
	// because of the assignment description (the minute should be number), added time is not considered (a goal scored at 45' + 2 is considered as scored at 45' and not at 47')
	return baseMinute;
};

const getFinalScore = (periods: Period[]) => {
	const fullTime = periods.find((period) => period.p_code === 'TOT');
	return {
		home: Number(fullTime?.home.score),
		away: Number(fullTime?.away.score),
	};
};

const getHalfTimeScore = (periods: Period[]) => {
	const halfTime = periods.find((period) => period.p_code === 'H1');
	return {
		home: Number(halfTime?.home.score),
		away: Number(halfTime?.away.score),
	};
};

const findPlayerByCode = (
	athletes: TeamAthletes[],
	code: string,
): TeamAthletes | undefined => {
	return athletes.find((athlete) => athlete.participantCode === code);
};

const buildScorers = (
	actions: Action[],
	homeItem?: Item,
	awayItem?: Item,
): MatchScorer[] => {
	const goalActions = actions
		.filter((action) => action.pbpa_Result === 'GOAL')
		.sort((a, b) => a.pbpa_order - b.pbpa_order);

	return goalActions
		.map((action): MatchScorer | null => {
			const competitor = action.competitors[0];
			if (!competitor) {
				return null;
			}

			const teamItem =
				competitor.pbpc_code === homeItem?.participant.code
					? homeItem
					: awayItem;
			if (!teamItem) {
				return null;
			}

			const scorerAthlete = competitor.athletes.find(
				(athlete) => athlete.pbpat_role === 'SCR',
			);
			if (!scorerAthlete) {
				return null;
			}

			const assistAthlete = competitor.athletes.find(
				(athlete) => athlete.pbpat_role === 'ASSIST',
			);
			const scorer = findPlayerByCode(
				teamItem.teamAthletes,
				scorerAthlete.pbpat_code,
			);
			const assist = assistAthlete
				? findPlayerByCode(teamItem.teamAthletes, assistAthlete.pbpat_code)
				: undefined;

			const scorerName = scorer
				? `${scorer.athlete.givenName} ${scorer.athlete.familyName}`
				: `#${scorerAthlete.pbpat_bib}`;

			const assistName = assist
				? `${assist.athlete.givenName} ${assist.athlete.familyName}`
				: undefined;

			return {
				team: teamItem.participant.name,
				player: scorerName,
				minute: getActionMinute(action),
				type: action.pbpa_Action.toLowerCase(),
				assist: assistName,
			};
		})
		.filter((scorer): scorer is MatchScorer => scorer !== null);
};

const getAthletePosition = (athlete: TeamAthletes): string => {
	const positionEntries = athlete.eventUnitEntries.filter(
		(entry) => entry.eue_code === POSITION_CODE,
	);

	const primary = positionEntries.find((entry) =>
		/^[A-Z]{2,3}$/.test(entry.eue_value),
	);
	return primary?.eue_value ?? positionEntries[0]?.eue_value ?? 'UNK';
};

const toMatchPlayer = (athlete: TeamAthletes): MatchPlayer => {
	const number = Number.parseInt(athlete.bib, 10);

	return {
		name: `${athlete.athlete.givenName} ${athlete.athlete.familyName}`,
		number: Number.isNaN(number) ? 0 : number,
		position: getAthletePosition(athlete),
	};
};

const buildLineup = (item?: Item) => {
	if (!item) {
		return {
			team: '',
			formation: '',
			coach: '',
			startingXI: [],
			bench: [],
		};
	}

	const formation =
		item.eventUnitEntries.find((entry) => entry.eue_code === FORMATION_CODE)
			?.eue_value ?? '';

	const headCoach = item.teamCoaches.find(
		(coach) => coach.function.functionCode === HEAD_COACH_CODE,
	)?.coach;

	const startingXI = item.teamAthletes
		.filter((athlete) =>
			athlete.eventUnitEntries.some(
				(entry) => entry.eue_code === STARTER_CODE && entry.eue_value === 'Y',
			),
		)
		.map(toMatchPlayer);

	const bench = item.teamAthletes
		.filter(
			(athlete) =>
				!athlete.eventUnitEntries.some(
					(entry) => entry.eue_code === STARTER_CODE && entry.eue_value === 'Y',
				),
		)
		.map(toMatchPlayer);

	return {
		team: item.participant.name,
		formation,
		coach: headCoach ? `${headCoach.givenName} ${headCoach.familyName}` : '',
		startingXI,
		bench,
	};
};

export const mapRetrievedMatchDetailsToMatchResponse = (
	data: Data,
): MatchResponse => {
	const items = data.results.items ?? [];
	const actions = data.results.playByPlay.flatMap((item) => item.actions ?? []);

	const homeItem = getItemBySide(items, 'HOME');
	const awayItem = getItemBySide(items, 'AWAY');

	const finalScore = getFinalScore(data.results.periods);
	const halfTimeScore = getHalfTimeScore(data.results.periods);

	const venue = data.results.schedule.venue.description ?? '';
	const location = data.results.schedule.location.description ?? '';
	const city = location.includes(',')
		? location.split(',').slice(1).join(',').trim()
		: location;

	return {
		competition: {
			name: 'Olympic Football Tournament',
			season: '2024',
			round: data.results.eventUnit.description,
		},
		venue: {
			name: venue,
			city,
		},
		kickoff: data.results.schedule.startDate,
		status: data.results.schedule.status.code === 'FINISHED' ? 'FT' : 'NS',
		teams: {
			home: homeItem?.participant.name ?? 'Home',
			away: awayItem?.participant.name ?? 'Away',
		},
		score: {
			...finalScore,
			halfTime: {
				...halfTimeScore,
			},
		},
		scorers: buildScorers(actions, homeItem, awayItem),
		lineups: {
			home: buildLineup(homeItem),
			away: buildLineup(awayItem),
		},
	};
};
