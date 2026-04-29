export type BlogStatus = 'draft' | 'published';

export type BlogTag = {
	id: string;
	name: string;
	createdAt: string;
	updatedAt?: string;
};

export type BlogAuthor = {
	id: string;
	name: string;
	avatarUrl: string;
	bio: string;
	skills: string[];
	socials: { label: string; url: string }[];
};

export type BlogPost = {
	id: string;
	title: string;
	slug: string;
	content: string; // Markdown
	featuredImageUrl: string;
	tagIds: string[];
	status: BlogStatus;
	authorId: string;
	createdAt: string; // ISO
	updatedAt?: string; // ISO
};

export type BlogState = {
	version: 1;
	author: BlogAuthor;
	tags: BlogTag[];
	posts: BlogPost[];
	viewCounts: Record<string, number>; // key: postId
};

