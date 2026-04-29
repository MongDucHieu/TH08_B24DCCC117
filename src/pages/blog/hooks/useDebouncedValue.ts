import { useEffect, useState } from 'react';

export default function useDebouncedValue<T>(value: T, delay: number = 300) {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		const t = window.setTimeout(() => setDebounced(value), delay);
		return () => window.clearTimeout(t);
	}, [value, delay]);

	return debounced;
}

