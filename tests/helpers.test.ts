import { describe, expect, it } from 'vitest';
import type { MatchOverview } from '@/types/retrievedData/matchOverview';
import {
	getDisplayCode,
	getMatchDayAndTime,
	getParticipantNames,
	getRowBackgroundClass,
	getStageKey,
	sortByStartDate,
} from '@/utils/helpers';

const createMatchOverview = (
	code: string,
	startDate: string,
	participantNames: string[] = ['Team A', 'Team B'],
): MatchOverview => ({
	code,
	startDate,
	start: participantNames.map((name) => ({
		participant: {
			name,
		},
	})),
});

describe('helpers', () => {
	it('sortByStartDate sorts by date and then code', () => {
		const items = [
			createMatchOverview('B-CODE', '2024-07-26T10:00:00Z'),
			createMatchOverview('A-CODE', '2024-07-26T10:00:00Z'),
			createMatchOverview('C-CODE', '2024-07-25T10:00:00Z'),
		];

		const sorted = sortByStartDate(items);

		expect(sorted.map((item) => item.code)).toEqual([
			'C-CODE',
			'A-CODE',
			'B-CODE',
		]);
	});

	it('sortByStartDate places invalid dates last', () => {
		const items = [
			createMatchOverview('INVALID', 'not-a-date'),
			createMatchOverview('VALID', '2024-07-25T10:00:00Z'),
		];

		const sorted = sortByStartDate(items);

		expect(sorted.map((item) => item.code)).toEqual(['VALID', 'INVALID']);
	});

	it('extracts display code from full schedule code', () => {
		expect(getDisplayCode('FBLMTEAM11------------GPB-000100--')).toBe(
			'GPB-000100',
		);
	});

	it('detects stage from display code', () => {
		expect(getStageKey('FBLMTEAM11------------QFNL-000100--')).toBe('QFNL');
		expect(getStageKey('FBLMTEAM11------------GPC-000300--')).toBe('GPC');
		expect(getStageKey('NO-STAGE')).toBe('');
	});

	it('maps row background by stage', () => {
		expect(getRowBackgroundClass('FBLMTEAM11------------SFNL-000100--')).toBe(
			'bg-fuchsia-200',
		);
		expect(getRowBackgroundClass('UNKNOWN')).toBe('bg-white');
	});

	it('formats date and time from ISO-like string', () => {
		expect(getMatchDayAndTime('2024-07-24T17:30:00Z')).toBe('2024-07-24 17:30');
	});

	it('returns dash for invalid date formatting input', () => {
		expect(getMatchDayAndTime('not-a-date')).toBe('-');
	});

	it('joins participant names with separator', () => {
		const schedule = createMatchOverview('CODE', '2024-07-24T17:30:00Z', [
			'Poland',
			'France',
		]);

		expect(getParticipantNames(schedule)).toBe('Poland : France');
	});

	it('returns dash when participants are missing', () => {
		const schedule = createMatchOverview('CODE', '2024-07-24T17:30:00Z');
		schedule.start = [];

		expect(getParticipantNames(schedule)).toBe('-');
	});
});
