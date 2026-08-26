import type { MatchOverview } from '@/types/retrievedData/matchOverview';

export const MATCH_DETAILS_API_PREFIX = '/api/match?CODE=';
export const WOMEN_CODE_PREFIX = 'FBLWTEAM11';
export const EXCLUDED_CODE_PART = 'VICTMEDAL';
export const KNOWN_STAGES = [
	'GPA',
	'GPB',
	'GPC',
	'GPD',
	'QFNL',
	'SFNL',
	'FNL',
] as const;

export type KnownStage = (typeof KNOWN_STAGES)[number];

export type StageLegendItem = {
	stage: KnownStage;
	colorClass: string;
	label: string;
};

export const STAGE_LEGEND_ITEMS: StageLegendItem[] = [
	{ stage: 'GPA', colorClass: 'bg-blue-50', label: 'Group A' },
	{ stage: 'GPB', colorClass: 'bg-green-50', label: 'Group B' },
	{ stage: 'GPC', colorClass: 'bg-yellow-50', label: 'Group C' },
	{ stage: 'GPD', colorClass: 'bg-orange-50', label: 'Group D' },
	{ stage: 'QFNL', colorClass: 'bg-violet-200', label: 'Quarter-final' },
	{ stage: 'SFNL', colorClass: 'bg-fuchsia-200', label: 'Semi-final' },
	{ stage: 'FNL', colorClass: 'bg-rose-300', label: 'Final' },
];

export const womenLegendItems = STAGE_LEGEND_ITEMS.filter(
	(item) => item.stage !== 'GPD',
);
export const menLegendItems = STAGE_LEGEND_ITEMS;
export const womenDefaultVisibleStages = womenLegendItems.map(
	(item) => item.stage,
);
export const menDefaultVisibleStages = menLegendItems.map((item) => item.stage);

export const sortByStartDate = (items: MatchOverview[]): MatchOverview[] =>
	[...items].sort((a, b) => {
		const timeA = Date.parse(a.startDate);
		const timeB = Date.parse(b.startDate);

		if (Number.isNaN(timeA) && Number.isNaN(timeB)) {
			return a.code.localeCompare(b.code);
		}

		if (Number.isNaN(timeA)) {
			return 1;
		}

		if (Number.isNaN(timeB)) {
			return -1;
		}

		if (timeA === timeB) {
			return a.code.localeCompare(b.code);
		}

		return timeA - timeB;
	});

export const getParticipantNames = (schedule: MatchOverview): string => {
	if (!schedule.start || schedule.start.length === 0) {
		return '-';
	}

	return schedule.start
		.map((entry) => entry.participant?.name)
		.filter((name): name is string => Boolean(name))
		.join(' : ');
};

export const getDisplayCode = (code: string): string => {
	const cleanedCode = code.replace(/-+$/g, '');
	const parts = cleanedCode.split(/-{4,}/).filter(Boolean);

	if (parts.length > 1) {
		return parts[parts.length - 1];
	}

	return cleanedCode;
};

export const getStageKey = (code: string): KnownStage | '' => {
	const displayCode = getDisplayCode(code);

	if (displayCode.startsWith('QFNL')) {
		return 'QFNL';
	}

	if (displayCode.startsWith('SFNL')) {
		return 'SFNL';
	}

	if (displayCode.startsWith('FNL')) {
		return 'FNL';
	}

	if (displayCode.startsWith('GPA')) {
		return 'GPA';
	}

	if (displayCode.startsWith('GPB')) {
		return 'GPB';
	}

	if (displayCode.startsWith('GPC')) {
		return 'GPC';
	}

	if (displayCode.startsWith('GPD')) {
		return 'GPD';
	}

	return '';
};

export const getRowBackgroundClass = (code: string): string => {
	const stage = getStageKey(code);

	if (stage === 'GPA') {
		return 'bg-blue-50';
	}

	if (stage === 'GPB') {
		return 'bg-green-50';
	}

	if (stage === 'GPC') {
		return 'bg-yellow-50';
	}

	if (stage === 'GPD') {
		return 'bg-orange-50';
	}

	if (stage === 'QFNL') {
		return 'bg-violet-200';
	}

	if (stage === 'SFNL') {
		return 'bg-fuchsia-200';
	}

	if (stage === 'FNL') {
		return 'bg-rose-300';
	}

	return 'bg-white';
};

export const getMatchDayAndTime = (startDate: string): string => {
	const isoLikeMatch = startDate.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);

	if (isoLikeMatch) {
		return `${isoLikeMatch[1]} ${isoLikeMatch[2]}`;
	}

	const parsedDate = new Date(startDate);
	if (Number.isNaN(parsedDate.getTime())) {
		return '-';
	}

	return `${parsedDate.toISOString().slice(0, 10)} ${parsedDate
		.toISOString()
		.slice(11, 16)}`;
};
