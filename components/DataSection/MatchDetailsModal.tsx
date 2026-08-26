import type { Match } from '@/types/match';

export type MatchDetailsState = {
	status: 'CLOSED' | 'LOADING' | 'ERROR' | 'SUCCESS';
	selectedCode?: string;
	error?: string;
	selectedMatch?: Match;
};

type MatchDetailsModalProps = {
	detailsState: MatchDetailsState;
	onClose: () => void;
};

export default function MatchDetailsModal({
	detailsState,
	onClose,
}: MatchDetailsModalProps) {
	if (detailsState.status === 'CLOSED') {
		return null;
	}

	const copyDetailsToClipboard = async () => {
		if (detailsState.status !== 'SUCCESS' || !detailsState.selectedMatch) {
			return;
		}

		await navigator.clipboard.writeText(
			JSON.stringify(detailsState.selectedMatch, null, 2),
		);
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-md bg-white p-4 shadow-lg">
				<div className="mb-3 flex items-start justify-between gap-4">
					<div>
						<h3 className="text-lg font-semibold">Match details</h3>
						<p className="text-xs text-gray-600">
							{detailsState.selectedCode ?? '-'}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
					>
						Close
					</button>
				</div>

				{detailsState.status === 'LOADING' ? (
					<p className="text-sm text-gray-600">Loading details...</p>
				) : null}

				{detailsState.status === 'ERROR' && detailsState.error ? (
					<p className="text-sm text-red-600">{detailsState.error}</p>
				) : null}

				{detailsState.status === 'SUCCESS' && detailsState.selectedMatch ? (
					<div className="relative">
						<button
							type="button"
							onClick={copyDetailsToClipboard}
							className="absolute right-2 top-2 rounded border border-gray-300 bg-white px-2 py-1 text-xs hover:bg-gray-100"
						>
							Copy
						</button>
						<pre className="overflow-auto rounded bg-gray-50 p-3 pr-16 text-xs">
							{JSON.stringify(detailsState.selectedMatch, null, 2)}
						</pre>
					</div>
				) : null}
			</div>
		</div>
	);
}
