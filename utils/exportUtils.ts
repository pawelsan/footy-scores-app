import type { MatchOverview } from '@/types/retrievedData/matchOverview';
import type { MatchResponse } from '@/types/match';
import { MATCH_DETAILS_API_PREFIX, sortByStartDate } from './helpers';

export type ExportResult = {
	matches: Record<string, MatchResponse>;
	errors: Record<string, string>;
	total: number;
	exported: number;
	failed: number;
};

export type ExportState =
	| { status: 'IDLE' }
	| { status: 'PENDING' }
	| { status: 'ERROR'; error: string };

export type ExportOptions = {
	signal?: AbortSignal;
	retries?: number;
};

const isAbortError = (error: unknown): boolean =>
	error instanceof DOMException
		? error.name === 'AbortError'
		: error instanceof Error && error.name === 'AbortError';

const fetchMatchWithRetry = async (
	code: string,
	endpointKey: string,
	options?: ExportOptions,
) => {
	const retries = options?.retries ?? 0;

	for (let attempt = 0; attempt <= retries; attempt += 1) {
		try {
			const response = await fetch(
				`${MATCH_DETAILS_API_PREFIX}${encodeURIComponent(code)}`,
				{ signal: options?.signal },
			);

			if (!response.ok) {
				const message = await getErrorMessage(response, code);

				if (attempt === retries) {
					return {
						endpoint: endpointKey,
						error: message,
					};
				}

				continue;
			}

			const payload = (await response.json()) as MatchResponse;
			return { endpoint: endpointKey, payload };
		} catch (error) {
			if (isAbortError(error)) {
				throw error;
			}

			if (attempt === retries) {
				return {
					endpoint: endpointKey,
					error:
						error instanceof Error ? error.message : `Failed to fetch ${code}.`,
				};
			}
		}
	}

	return {
		endpoint: endpointKey,
		error: `Failed to fetch ${code}.`,
	};
};

const getErrorMessage = async (
	response: Response,
	code: string,
): Promise<string> => {
	let message = `Failed to fetch ${code}. Status: ${response.status}`;

	try {
		const errorPayload = (await response.json()) as { error?: string };
		if (errorPayload.error) {
			message = errorPayload.error;
		}
	} catch {
		// Keep fallback message if the error payload is not JSON.
	}

	return message;
};

export const downloadJsonFile = (filename: string, payload: unknown) => {
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: 'application/json',
	});
	const objectUrl = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = objectUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(objectUrl);
};

export const exportSchedulesToJson = async (
	schedules: MatchOverview[],
	options?: ExportOptions,
): Promise<ExportResult> => {
	const sortedSchedules = sortByStartDate(schedules);

	const settled = await Promise.all(
		sortedSchedules.map(async (schedule) => {
			const endpointKey = `${MATCH_DETAILS_API_PREFIX}${schedule.code}`;

			return fetchMatchWithRetry(schedule.code, endpointKey, options);
		}),
	);

	const matches: Record<string, MatchResponse> = {};
	const errors: Record<string, string> = {};

	for (const result of settled) {
		if ('payload' in result && result.payload) {
			matches[result.endpoint] = result.payload;
		} else {
			errors[result.endpoint] = result.error ?? 'Unknown export error.';
		}
	}

	return {
		matches,
		errors,
		total: sortedSchedules.length,
		exported: Object.keys(matches).length,
		failed: Object.keys(errors).length,
	};
};
