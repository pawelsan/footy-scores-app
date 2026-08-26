import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/match/route';

const originalFetch = global.fetch;

const validUpstreamPayload = {
	results: {
		items: [],
		playByPlay: [],
		eventUnit: {
			description: 'Round 1',
			longDescription: 'Round 1',
			shortDescription: 'R1',
		},
		periods: [],
		schedule: {
			startDate: '2024-07-24T17:30:00Z',
			endDate: '2024-07-24T19:30:00Z',
			status: { code: 'SCHEDULED' },
			venue: { description: 'Some venue' },
			location: { description: 'Paris, France' },
		},
	},
};

describe('/api/match route', () => {
	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		global.fetch = originalFetch;
	});

	it('returns 400 when CODE query param is missing', async () => {
		const response = await GET(new Request('http://localhost/api/match'));
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(400);
		expect(body.error).toBe('Missing required query parameter: CODE');
	});

	it('returns 400 when CODE query param is empty', async () => {
		const response = await GET(
			new Request('http://localhost/api/match?CODE=%20%20%20'),
		);
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(400);
		expect(body.error).toBe('CODE cannot be empty');
	});

	it('returns 502 when upstream responds with non-ok status', async () => {
		vi.mocked(global.fetch).mockResolvedValue(
			new Response('upstream failed', { status: 503 }),
		);

		const response = await GET(
			new Request(
				'http://localhost/api/match?CODE=FBLMTEAM11------------GPB-000100--',
			),
		);
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(502);
		expect(body.error).toContain('Failed to fetch match details. Status: 503');
	});

	it('returns 502 when upstream payload shape is invalid', async () => {
		vi.mocked(global.fetch).mockResolvedValue(
			new Response(JSON.stringify({ unexpected: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const response = await GET(
			new Request(
				'http://localhost/api/match?CODE=FBLMTEAM11------------GPB-000100--',
			),
		);
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(502);
		expect(body.error).toBe('Unexpected upstream payload format');
	});

	it('returns 500 when fetch throws an exception', async () => {
		vi.mocked(global.fetch).mockRejectedValue(new Error('network down'));

		const response = await GET(
			new Request(
				'http://localhost/api/match?CODE=FBLMTEAM11------------GPB-000100--',
			),
		);
		const body = (await response.json()) as { error: string };

		expect(response.status).toBe(500);
		expect(body.error).toBe('network down');
	});

	it('returns 200 and mapped payload on success', async () => {
		vi.mocked(global.fetch).mockResolvedValue(
			new Response(JSON.stringify(validUpstreamPayload), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			}),
		);

		const response = await GET(
			new Request(
				'http://localhost/api/match?CODE=FBLMTEAM11------------GPB-000100--',
			),
		);
		const body = (await response.json()) as {
			competition: { name: string };
			teams: { home: string; away: string };
			status: string;
		};

		expect(response.status).toBe(200);
		expect(body.competition.name).toBe('Olympic Football Tournament');
		expect(body.teams.home).toBe('Home');
		expect(body.teams.away).toBe('Away');
		expect(body.status).toBe('NS');
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});
});
