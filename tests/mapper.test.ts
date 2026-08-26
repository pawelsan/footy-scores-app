import { describe, expect, it } from 'vitest';
import type { Data } from '@/types/retrievedData/matchDetails';
import { mapRetrievedMatchDetailsToMatchResponse } from '@/utils/mapper';

const createBaseData = (): Data => ({
	results: {
		items: [
			{
				eventUnitEntries: [{ eue_code: 'HOME_AWAY', eue_value: 'HOME' }],
				participant: { code: 'HOME_CODE', name: 'Home FC' },
				teamAthletes: [
					{
						bib: '9',
						participantCode: 'P1',
						athlete: { givenName: 'John', familyName: 'Doe' },
						eventUnitEntries: [
							{ eue_code: 'POSITION', eue_value: 'ST' },
							{ eue_code: 'STARTER', eue_value: 'Y' },
						],
					},
					{
						bib: '8',
						participantCode: 'P2',
						athlete: { givenName: 'Max', familyName: 'Assist' },
						eventUnitEntries: [{ eue_code: 'POSITION', eue_value: 'CM' }],
					},
				],
				teamCoaches: [
					{
						function: { functionCode: 'COACH' },
						coach: { familyName: 'Boss', givenName: 'Big' },
					},
				],
			},
			{
				eventUnitEntries: [{ eue_code: 'HOME_AWAY', eue_value: 'AWAY' }],
				participant: { code: 'AWAY_CODE', name: 'Away FC' },
				teamAthletes: [
					{
						bib: '10',
						participantCode: 'A1',
						athlete: { givenName: 'Away', familyName: 'Player' },
						eventUnitEntries: [
							{ eue_code: 'POSITION', eue_value: 'ST' },
							{ eue_code: 'STARTER', eue_value: 'Y' },
						],
					},
				],
				teamCoaches: [
					{
						function: { functionCode: 'COACH' },
						coach: { familyName: 'AwayCoach', givenName: 'Jane' },
					},
				],
			},
		],
		playByPlay: [
			{
				actions: [
					{
						pbpa_order: 2,
						pbpa_Action: 'OPEN_PLAY',
						pbpa_When: '45+2',
						pbpa_Result: 'GOAL',
						competitors: [
							{
								pbpc_code: 'HOME_CODE',
								athletes: [
									{
										pbpat_code: 'P1',
										pbpat_bib: '9',
										pbpat_role: 'SCR',
									},
									{
										pbpat_code: 'P2',
										pbpat_bib: '8',
										pbpat_role: 'ASSIST',
									},
								],
							},
						],
					},
					{
						pbpa_order: 1,
						pbpa_Action: 'YELLOW_CARD',
						pbpa_When: '10',
						pbpa_Result: 'CARD',
						competitors: [],
					},
				],
			},
		],
		eventUnit: {
			description: 'Round 1',
		},
		periods: [
			{ p_code: 'H1', home: { score: '1' }, away: { score: '0' } },
			{ p_code: 'TOT', home: { score: '2' }, away: { score: '1' } },
		],
		schedule: {
			startDate: '2024-07-24T17:30:00Z',
			status: { code: 'FINISHED' },
			venue: { description: 'Parc des Princes' },
			location: { description: 'Paris, France' },
		},
	},
});

describe('mapRetrievedMatchDetailsToMatchResponse', () => {
	it('maps score, status, teams and scorers', () => {
		const data = createBaseData();
		const result = mapRetrievedMatchDetailsToMatchResponse(data);

		expect(result.status).toBe('FT');
		expect(result.teams.home).toBe('Home FC');
		expect(result.teams.away).toBe('Away FC');
		expect(result.score.home).toBe(2);
		expect(result.score.away).toBe(1);
		expect(result.score.halfTime.home).toBe(1);
		expect(result.score.halfTime.away).toBe(0);
		expect(result.scorers).toHaveLength(1);
		expect(result.scorers[0]).toMatchObject({
			team: 'Home FC',
			player: 'John Doe',
			assist: 'Max Assist',
			minute: 45,
			type: 'open_play',
		});
	});

	it('falls back safely when minute or schedule data is missing', () => {
		const data = createBaseData();
		const firstAction = data.results.playByPlay?.[0]?.actions?.[0];
		if (!firstAction) {
			throw new Error(
				'Expected at least one play-by-play action in test fixture',
			);
		}
		firstAction.pbpa_When = undefined as unknown as string;
		data.results.schedule = undefined as unknown as Data['results']['schedule'];

		const result = mapRetrievedMatchDetailsToMatchResponse(data);

		expect(result.kickoff).toBe('');
		expect(result.status).toBe('NS');
		expect(result.scorers[0].minute).toBe(0);
	});

	it('uses fallback team names when side mapping is unavailable', () => {
		const data = createBaseData();
		data.results.items = [];

		const result = mapRetrievedMatchDetailsToMatchResponse(data);

		expect(result.teams.home).toBe('Home');
		expect(result.teams.away).toBe('Away');
		expect(result.lineups.home.team).toBe('');
		expect(result.lineups.away.team).toBe('');
	});
});
