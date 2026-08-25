import type {
	Action,
	Data,
	Item,
	TeamAthletes,
} from '../types/retrievedData/matchDetails';
import type { Match, MatchPlayer, MatchScorer } from '../types/match';

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

const parseScoreValue = (value?: string): number => {
	if (!value) {
		return 0;
	}

	const parsed = Number.parseInt(value, 10);
	return Number.isNaN(parsed) ? 0 : parsed;
};

const getActionMinute = (action: Action): number => {
	const base = action.pbpa_When.match(/\d+/);
	const added = action.pbpa_When.match(/\+\s*(\d+)/);

	const baseMinute = base ? Number.parseInt(base[0], 10) : 0;
	const addedMinute = added ? Number.parseInt(added[1], 10) : 0;

	return baseMinute + addedMinute;
};

const getFinalScore = (actions: Action[]) => {
	if (actions.length === 0) {
		return { home: 0, away: 0 };
	}

	const sorted = [...actions].sort((a, b) => a.pbpa_order - b.pbpa_order);
	const lastWithScore = [...sorted]
		.reverse()
		.find(
			(action) =>
				action.pbpa_ScoreH !== undefined && action.pbpa_ScoreA !== undefined,
		);

	if (!lastWithScore) {
		return { home: 0, away: 0 };
	}

	return {
		home: parseScoreValue(lastWithScore.pbpa_ScoreH),
		away: parseScoreValue(lastWithScore.pbpa_ScoreA),
	};
};

const getHalfTimeScore = (actions: Action[]) => {
	const firstHalf = actions
		.filter((action) => action.pbpa_period === 'H1')
		.sort((a, b) => a.pbpa_order - b.pbpa_order);

	if (firstHalf.length === 0) {
		return { home: 0, away: 0 };
	}

	const last = firstHalf[firstHalf.length - 1];
	return {
		home: parseScoreValue(last.pbpa_ScoreH),
		away: parseScoreValue(last.pbpa_ScoreA),
	};
};

const findPlayerByBib = (
	athletes: TeamAthletes[],
	bib: string,
): TeamAthletes | undefined => {
	return athletes.find((athlete) => athlete.bib === bib);
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

			const teamItem = competitor.pbpc_order === 1 ? homeItem : awayItem;
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
			const scorer = findPlayerByBib(
				teamItem.teamAthletes,
				scorerAthlete.pbpat_bib,
			);
			const assist = assistAthlete
				? findPlayerByBib(teamItem.teamAthletes, assistAthlete.pbpat_bib)
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

export const mapMatchDetailsToMatch = (data: Data): Match => {
	const items = data.results.items ?? [];
	const actions = data.results.playByPlay.flatMap((item) => item.actions ?? []);

	const homeItem = getItemBySide(items, 'HOME');
	const awayItem = getItemBySide(items, 'AWAY');

	const finalScore = getFinalScore(actions);
	const halfTime = getHalfTimeScore(actions);

	const location = data.results.schedule.location.description ?? '';
	const city = location.includes(',')
		? location.split(',').slice(1).join(',').trim()
		: location;

	return {
		competition: {
			name: data.results.eventUnit.description,
			season: '',
			round: '',
		},
		venue: {
			name: location,
			city,
		},
		kickoff: data.results.schedule.startDate,
		status: actions.length > 0 ? 'FT' : 'NS',
		teams: {
			home: homeItem?.participant.name ?? 'Home',
			away: awayItem?.participant.name ?? 'Away',
		},
		score: {
			home: finalScore.home,
			away: finalScore.away,
			halfTime: {
				home: halfTime.home,
				away: halfTime.away,
			},
		},
		scorers: buildScorers(actions, homeItem, awayItem),
		lineups: {
			home: buildLineup(homeItem),
			away: buildLineup(awayItem),
		},
	};
};
