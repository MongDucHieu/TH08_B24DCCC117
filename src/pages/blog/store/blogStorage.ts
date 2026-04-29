import type { BlogPost, BlogState } from './types';
import { getSeedState } from './seed';
import type { BlogTag } from './types';

const BLOG_STORAGE_KEY = 'blog_state_v1';

function isBrowser() {
	return typeof window !== 'undefined';
}

export function readBlogState(): BlogState | undefined {
	if (!isBrowser()) return undefined;
	try {
		const raw = window.localStorage.getItem(BLOG_STORAGE_KEY);
		if (!raw) return undefined;
		return JSON.parse(raw) as BlogState;
	} catch {
		return undefined;
	}
}

export function writeBlogState(state: BlogState) {
	if (!isBrowser()) return;
	window.localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(state));
}

export function ensureBlogSeed(): BlogState {
	const existing = readBlogState();
	if (existing && existing.version === 1) return existing;
	const seed = getSeedState();
	writeBlogState(seed);
	return seed;
}

export function getBlogState(): BlogState {
	return ensureBlogSeed();
}

export function updateBlogState(mutator: (draft: BlogState) => void): BlogState {
	const state = getBlogState();
	// We can safely mutate since we immediately persist the whole object.
	mutator(state);
	writeBlogState(state);
	return state;
}

export function upsertPost(next: BlogPost): BlogState {
	return updateBlogState((draft) => {
		const idx = draft.posts.findIndex((p) => p.id === next.id);
		if (idx >= 0) draft.posts[idx] = next;
		else draft.posts.unshift(next);
	});
}

export function deletePost(postId: string) {
	return updateBlogState((draft) => {
		draft.posts = draft.posts.filter((p) => p.id !== postId);
		delete draft.viewCounts[postId];
	});
}

export function upsertTag(next: BlogTag): BlogState {
	return updateBlogState((draft) => {
		const idx = draft.tags.findIndex((t) => t.id === next.id);
		if (idx >= 0) draft.tags[idx] = next;
		else draft.tags.unshift(next);
	});
}

export function deleteTag(tagId: string) {
	return updateBlogState((draft) => {
		draft.tags = draft.tags.filter((t) => t.id !== tagId);
		draft.posts = draft.posts.map((p) => ({
			...p,
			tagIds: p.tagIds.filter((id) => id !== tagId),
		}));
	});
}

export function incrementView(postId: string): BlogState {
	return updateBlogState((draft) => {
		draft.viewCounts[postId] = (draft.viewCounts[postId] ?? 0) + 1;
	});
}

export function getPostBySlug(slug: string): BlogPost | undefined {
	const { posts } = getBlogState();
	return posts.find((p) => p.slug === slug);
}

export function getViewCount(postId: string): number {
	return getBlogState().viewCounts[postId] ?? 0;
}

