'use client';

import { useState } from 'react';
import DataSection from '@/components/DataSection';
import { fetchFootballScheduleList } from '@/services/scheduleListService';
import type { MatchOverview } from '@/types/retrievedData/matchOverview';

type HomeState =
	| { status: 'LOADING' }
	| { status: 'ERROR'; error: string }
	| { status: 'SUCCESS'; payload: MatchOverview[] };

export default function Home() {
	const [state, setState] = useState<HomeState>({
		status: 'SUCCESS',
		payload: [],
	});

	const handleLoadData = async () => {
		setState({ status: 'LOADING' });

		try {
			const data = await fetchFootballScheduleList();
			setState({ status: 'SUCCESS', payload: data.schedules ?? [] });
		} catch (fetchError) {
			setState({
				status: 'ERROR',
				error:
					fetchError instanceof Error
						? fetchError.message
						: 'Failed to load data.',
			});
		}
	};

	const schedules = state.status === 'SUCCESS' ? state.payload : [];
	const isLoading = state.status === 'LOADING';
	const error = state.status === 'ERROR' ? state.error : null;

	return (
		<main className="flex min-h-screen flex-col items-center gap-6 p-8">
			<h1 className="text-3xl font-bold">Footy scores app</h1>
			<button
				onClick={handleLoadData}
				disabled={isLoading}
				className="rounded-md bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-70"
			>
				Load data
			</button>
			<DataSection schedules={schedules} isLoading={isLoading} error={error} />
		</main>
	);
}
