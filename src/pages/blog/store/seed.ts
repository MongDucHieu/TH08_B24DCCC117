import type { BlogAuthor, BlogPost, BlogState, BlogStatus, BlogTag } from './types';
import { makeId } from '@/utils/utils';

const nowIso = () => new Date().toISOString();

const relativeIso = (daysAgo: number) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

const slugify = (s: string) =>
	s
		.toString()
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/đ/g, 'd')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '');

const statusLabelToValue = (label: string): BlogStatus => (label.toLowerCase().includes('draft') ? 'draft' : 'published');

export const getSeedState = (): BlogState => {
	// Fixed author for the blog demo
	const author: BlogAuthor = {
		id: 'author-1',
		name: 'Nguyễn Minh',
		avatarUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=256&q=60',
		bio: 'Mình viết về React, TypeScript và các bài học xây sản phẩm thực tế.',
		skills: ['React', 'TypeScript', 'Umi', 'UI Engineering'],
		socials: [
			{ label: 'GitHub', url: 'https://github.com/' },
			{ label: 'LinkedIn', url: 'https://www.linkedin.com/' },
			{ label: 'Website', url: 'https://example.com/' },
		],
	};

	const tagNames = ['React', 'TypeScript', 'Umi', 'Design', 'Product', 'Learning'];
	const tags: BlogTag[] = tagNames.map((name, idx) => ({
		id: `tag-${idx + 1}`,
		name,
		createdAt: relativeIso(60),
		updatedAt: relativeIso(10),
	}));

	const pickTagIds = (i: number) => {
		const a = tags[i % tags.length]?.id;
		const b = tags[(i + 2) % tags.length]?.id;
		return Array.from(new Set([a, b].filter(Boolean))) as string[];
	};

	const basePosts: Array<Pick<BlogPost, 'title' | 'content' | 'featuredImageUrl' | 'status'>> = [
		{
			title: 'Bắt đầu với React và suy nghĩ theo component',
			content:
				'# Bắt đầu với React\n\nReact giúp mình chia bài toán thành các component rõ ràng.\n\n## Tóm tắt\n- Tách UI thành phần nhỏ\n- Dữ liệu chảy theo props\n- State chỉ lưu dữ liệu cần thiết\n\n> Viết code dễ đọc quan trọng hơn viết code nhanh.\n\nMột ví dụ code:\n\n```js\nfunction sum(a, b) {\n  return a + b;\n}\n```\n\nChúc bạn build vui vẻ!',
			featuredImageUrl:
				'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=60',
			status: statusLabelToValue('published'),
		},
		{
			title: 'TypeScript cho dự án thực tế: từ “any” tới type-safe',
			content:
				'# TypeScript cho dự án thực tế\n\nKhi dự án lớn lên, type giúp giảm bug.\n\n## Gợi ý\n- Tránh dùng `any` nếu không cần\n- Viết type cho dữ liệu API\n- Dùng union cho trạng thái\n\n## Ví dụ\nInline code: `type User = { id: string }`\n\nChỗ mình hay bắt đầu là: map response -> model.',
			featuredImageUrl:
				'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=60',
			status: statusLabelToValue('published'),
		},
		{
			title: 'Umi & Ant Design Pro: cấu trúc dự án gọn hơn',
			content:
				'# Umi & Ant Design Pro\n\nUmi giúp routing, layout và i18n nhanh chóng.\n\n## Một vài điều mình thích\n1. Convention-based giúp giảm boilerplate\n2. Dynamic import giúp trang tải nhanh hơn\n3. Layout Pro có sẵn nhiều pattern\n\n> Đừng ngại “thử” sớm, sửa muộn sẽ tốn hơn.',
			featuredImageUrl:
				'https://images.unsplash.com/photo-1556745757-8d76bfc41b82?auto=format&fit=crop&w=1200&q=60',
			status: statusLabelToValue('published'),
		},
		{
			title: 'Thiết kế UI: khoảng trắng, typography và nhịp bố cục',
			content:
				'# Thiết kế UI\n\nKhoảng trắng (spacing) tạo ra cảm giác “ngon” cho giao diện.\n\n## Checklist nhỏ\n- Typography nhất quán\n- Button có hierarchy\n- Card đủ padding\n\n**Bold** và *italic* đều có ý nghĩa trong nội dung.',
			featuredImageUrl:
				'https://images.unsplash.com/photo-1526481280695-3c687fd5432c?auto=format&fit=crop&w=1200&q=60',
			status: statusLabelToValue('published'),
		},
		{
			title: 'Product thinking: viết bài khi bạn hiểu rõ vấn đề',
			content:
				'# Product thinking\n\nTrước khi build tính năng, hãy trả lời: người dùng muốn gì?\n\n## Cách mình làm\n- Viết user story\n- Xác định metric\n- Thiết kế flow\n\nNếu bạn làm đúng ngay từ đầu, code sẽ ít hơn.',
			featuredImageUrl:
				'https://images.unsplash.com/photo-1521737604893-d14ccf44e44f?auto=format&fit=crop&w=1200&q=60',
			status: statusLabelToValue('published'),
		},
		{
			title: 'Học theo chu kỳ: làm - đo - cải tiến',
			content:
				'# Học theo chu kỳ\n\nMình học hiệu quả hơn khi làm xong rồi quay lại đo lường.\n\n- Làm\n- Đo\n- Cải tiến\n\n`Learning loop` là thứ mình quay lại nhiều nhất.',
			featuredImageUrl:
				'https://images.unsplash.com/photo-1516571749839-1a2f4b5ce0b9?auto=format&fit=crop&w=1200&q=60',
			status: statusLabelToValue('draft'),
		},
	];

	const posts: BlogPost[] = [];
	const total = 18; // >= 2 pages with 9 items/page
	for (let i = 0; i < total; i += 1) {
		const base = basePosts[i % basePosts.length];
		const title = i < basePosts.length ? base.title : `${base.title} (Phần ${i + 1})`;
		const content = `${base.content}\n\n---\n\n## Ghi chú\nBài viết demo số ${i + 1} để bạn test pagination & search.\n`;
		const slug = slugify(title) + (i === 0 ? '' : `-${i + 1}`);
		const createdAt = relativeIso(1 + i * 2);
		const id = `post-${i + 1}`;
		const status: BlogStatus = i % 7 === 0 ? 'draft' : 'published';
		const featuredImageUrl = base.featuredImageUrl;
		posts.push({
			id,
			title,
			slug,
			content,
			featuredImageUrl,
			tagIds: pickTagIds(i),
			status,
			authorId: author.id,
			createdAt,
			updatedAt: i % 3 === 0 ? relativeIso(i * 1.2) : undefined,
		});
	}

	const viewCounts: Record<string, number> = {};
	posts.forEach((p, idx) => {
		viewCounts[p.id] = 20 + idx * 7;
	});

	return {
		version: 1,
		author,
		tags,
		posts,
		viewCounts,
	};
};

export const generateUniqueSlug = (title: string, existingSlugs: string[]): string => {
	let base = title
		.toString()
		.trim()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase()
		.replace(/đ/g, 'd')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)+/g, '');

	if (!base) base = makeId(8).toLowerCase();

	let candidate = base;
	let n = 2;
	while (existingSlugs.includes(candidate)) {
		candidate = `${base}-${n}`;
		n += 1;
	}
	return candidate;
};

