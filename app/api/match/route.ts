import { NextResponse } from 'next/server';
import type { Data } from '@/types/retrievedData/matchDetails';
import { mapRetrievedMatchDetailsToMatchResponse } from '@/utils/mapper';

const DETAILS_URL_BASE =
	'https://stacy.olympics.com/OG2024/data/RES_ByRSC_H2H~comp=OG2024~disc=FBL~rscResult=';
const DETAILS_URL_TAIL = '~lang=ENG.json';
const DETAILS_CACHE_REVALIDATE_SECONDS = 3600;

const normalizeCode = (value: string): string => value.trim();
const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null;

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const codeParam = searchParams.get('CODE');

	if (!codeParam) {
		return NextResponse.json(
			{ error: 'Missing required query parameter: CODE' },
			{ status: 400 },
		);
	}

	const normalizedCode = normalizeCode(codeParam);
	if (!normalizedCode) {
		return NextResponse.json(
			{ error: 'CODE cannot be empty' },
			{ status: 400 },
		);
	}

	const detailsUrl = `${DETAILS_URL_BASE}${encodeURIComponent(normalizedCode)}${DETAILS_URL_TAIL}`;

	try {
		const response = await fetch(detailsUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
			cache: 'force-cache',
			next: { revalidate: DETAILS_CACHE_REVALIDATE_SECONDS },
		});

		if (!response.ok) {
			return NextResponse.json(
				{
					error: `Failed to fetch match details. Status: ${response.status}`,
				},
				{ status: 502 },
			);
		}

		const payload: unknown = await response.json();

		if (!isObject(payload) || !('results' in payload)) {
			return NextResponse.json(
				{ error: 'Unexpected upstream payload format' },
				{ status: 502 },
			);
		}

		const typedPayload = payload as unknown as Data;
		const mapped = mapRetrievedMatchDetailsToMatchResponse(typedPayload);

		return NextResponse.json(mapped, { status: 200 });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: 'Unexpected error while retrieving match details',
			},
			{ status: 500 },
		);
	}
}
