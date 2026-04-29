import type { BlogAuthor, BlogPost, BlogTag } from '../store/types';
import { getMarkdownSummary } from './markdown';

export function getTagsByIds(tags: BlogTag[], ids: string[]) {
	const tagMap = new Map(tags.map((t) => [t.id, t]));
	return ids.map((id) => tagMap.get(id)).filter(Boolean) as BlogTag[];
}

export function getPostSummary(post: BlogPost, limit: number = 170) {
	return getMarkdownSummary(post.content, limit);
}

export function formatDateVi(iso?: string) {
	if (!iso) return '';
	try {
		// avoid adding moment dependency imports here; date formatting is simple enough
		const d = new Date(iso);
		return d.toLocaleDateString('vi-VN');
	} catch {
		return iso;
	}
}

export function getAuthorLabel(author: BlogAuthor) {
	return author.name;
}

