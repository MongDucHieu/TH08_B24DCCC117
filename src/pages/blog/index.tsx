import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Input, Pagination, Row, Space, Tag } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'umi';
import { useLocation } from 'react-router-dom';
import useDebouncedValue from './hooks/useDebouncedValue';
import { getBlogState } from './store/blogStorage';
import type { BlogPost, BlogTag } from './store/types';
import { getAuthorLabel, getPostSummary, getTagsByIds, formatDateVi } from './utils/blogHelpers';
import BlogAboutPage from './about';
import BlogDetailPage from './detail';
import BlogAdminPostsPage from './admin/posts';
import BlogAdminTagsPage from './admin/tags';
import './index.less';

const PAGE_SIZE = 9;

function getTagUsage(posts: BlogPost[]) {
	const map = new Map<string, number>();
	posts.forEach((p) => {
		p.tagIds.forEach((id) => map.set(id, (map.get(id) ?? 0) + 1));
	});
	return map;
}

function normalizeStatus(status: any): BlogPost['status'] | undefined {
	if (!status) return undefined;
	const s = String(status).toLowerCase();
	if (s === 'published') return 'published';
	if (s === 'draft') return 'draft';
	return undefined;
}

function getQueryParam(search: string, key: string) {
	try {
		return new URLSearchParams(search).get(key);
	} catch {
		return null;
	}
}

const HomeView = () => {
	const [stateLoaded, setStateLoaded] = useState(false);
	const [state, setState] = useState(() => getBlogState());

	const [selectedTagId, setSelectedTagId] = useState<string | undefined>(undefined);
	const [page, setPage] = useState(1);

	const [searchValue, setSearchValue] = useState('');
	const debouncedSearch = useDebouncedValue(searchValue, 300);

	useEffect(() => {
		// Re-read state on mount so data after CRUD updates is reflected when navigating back.
		setState(getBlogState());
		setStateLoaded(true);
	}, []);

	const publishedPosts = useMemo(
		() => state.posts.filter((p) => normalizeStatus(p.status) === 'published'),
		[state.posts],
	);

	const tagUsage = useMemo(() => getTagUsage(publishedPosts), [publishedPosts]);

	const filteredPosts = useMemo(() => {
		const keyword = debouncedSearch.trim().toLowerCase();
		let list = publishedPosts;

		if (selectedTagId) {
			list = list.filter((p) => p.tagIds.includes(selectedTagId));
		}

		if (keyword) {
			list = list.filter((p) => {
				const inTitle = p.title.toLowerCase().includes(keyword);
				// Keep search simple/fast: check raw markdown content too.
				const inContent = p.content.toLowerCase().includes(keyword);
				return inTitle || inContent;
			});
		}

		return [...list].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
	}, [publishedPosts, selectedTagId, debouncedSearch]);

	useEffect(() => {
		setPage(1);
	}, [selectedTagId, debouncedSearch]);

	const total = filteredPosts.length;
	const pageList = filteredPosts.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE);

	const tagsSorted: BlogTag[] = useMemo(() => {
		const all = [...state.tags];
		all.sort((a, b) => (tagUsage.get(b.id) ?? 0) - (tagUsage.get(a.id) ?? 0));
		return all;
	}, [state.tags, tagUsage]);

	return (
		<div className='blog-home'>
			<div className='blog-hero'>
				<div className='blog-hero-title'>Blog cá nhân</div>
				<div className='blog-hero-sub'>
					{state.author?.bio ?? 'Chia sẻ kiến thức theo cách dễ hiểu.'}
				</div>
				<div className='blog-hero-stats'>
					<Tag color='blue'>{publishedPosts.length} bài đã đăng</Tag>
					<Tag color='default'>Lọc theo tag & tìm kiếm</Tag>
				</div>
			</div>

			<div className='blog-search-row'>
				<Input
					allowClear
					style={{ width: 380, maxWidth: '100%' }}
					placeholder='Tìm kiếm bài viết...'
					value={searchValue}
					onChange={(e) => setSearchValue(e.target.value)}
					prefix={<SearchOutlined />}
				/>
				{selectedTagId ? (
					<Space>
						<Tag
							color='blue'
							style={{ cursor: 'pointer' }}
							onClick={() => {
								setSelectedTagId(undefined);
							}}
						>
							Bộ lọc tag: {state.tags.find((t) => t.id === selectedTagId)?.name ?? ''}
						</Tag>
					</Space>
				) : null}
			</div>

			<div className='blog-tag-filter'>
				<Tag
					color={!selectedTagId ? 'blue' : undefined}
					style={{ cursor: 'pointer' }}
					onClick={() => setSelectedTagId(undefined)}
				>
					Tất cả
				</Tag>
				{tagsSorted.map((t) => {
					const count = tagUsage.get(t.id) ?? 0;
					return (
						<Tag
							key={t.id}
							color={selectedTagId === t.id ? 'blue' : undefined}
							style={{ cursor: count > 0 ? 'pointer' : 'not-allowed', opacity: count > 0 ? 1 : 0.4 }}
							onClick={() => {
								if (count <= 0) return;
								setSelectedTagId(t.id);
							}}
						>
							{t.name} ({count})
						</Tag>
					);
				})}
			</div>

			<div style={{ marginTop: 18 }}>
				{stateLoaded && pageList.length === 0 ? (
					<Empty description='Không có bài viết phù hợp' />
				) : (
					<Row gutter={[16, 16]}>
						{pageList.map((post) => {
							const tags = getTagsByIds(state.tags, post.tagIds);
							return (
								<Col key={post.id} xs={24} sm={12} md={8}>
									<Card
										className='blog-card'
										hoverable
										bordered
										cover={
											post.featuredImageUrl ? (
												<img
													alt={post.title}
													style={{ height: 180, objectFit: 'cover', width: '100%' }}
													src={post.featuredImageUrl}
												/>
											) : undefined
										}
									>
										<div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>
											<Link to={`/blog?mode=detail&slug=${encodeURIComponent(post.slug)}`}>{post.title}</Link>
										</div>

										<div className='blog-card-meta'>
											{formatDateVi(post.createdAt)} • {getAuthorLabel(state.author)}
										</div>

										<div className='blog-card-summary'>
											{getPostSummary(post)}
										</div>

										<div className='blog-card-tags'>
											{tags.map((t) => (
												<Tag
													key={t.id}
													color={selectedTagId === t.id ? 'blue' : undefined}
													style={{ cursor: 'pointer' }}
													onClick={() => setSelectedTagId(t.id)}
												>
													{t.name}
												</Tag>
											))}
										</div>
									</Card>
								</Col>
							);
						})}
					</Row>
				)}
			</div>

			<div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
				<Pagination
					current={page}
					pageSize={PAGE_SIZE}
					total={total}
					onChange={(p) => setPage(p)}
					showSizeChanger={false}
				/>
			</div>

			<div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
				<Link to='/blog?mode=about'>
					<Button>Giới thiệu</Button>
				</Link>
				<Link to='/blog?mode=admin-posts'>
					<Button>Quản lý bài viết</Button>
				</Link>
				<Link to='/blog?mode=admin-tags'>
					<Button>Quản lý thẻ</Button>
				</Link>
			</div>
		</div>
	);
};

const BlogPage = () => {
	const location = useLocation();
	const mode = getQueryParam(location.search, 'mode') ?? 'home';

	const nav = (
		<Space size={12} style={{ marginBottom: 16, flexWrap: 'wrap' }}>
			<Link to='/blog'>
				<Button type={mode === 'home' ? 'primary' : 'default'}>Trang chủ</Button>
			</Link>
			<Link to='/blog?mode=about'>
				<Button type={mode === 'about' ? 'primary' : 'default'}>Giới thiệu</Button>
			</Link>
			<Link to='/blog?mode=admin-posts'>
				<Button type={mode === 'admin-posts' ? 'primary' : 'default'}>Quản lý bài viết</Button>
			</Link>
			<Link to='/blog?mode=admin-tags'>
				<Button type={mode === 'admin-tags' ? 'primary' : 'default'}>Quản lý thẻ</Button>
			</Link>
		</Space>
	);

	return (
		<>
			{mode !== 'detail' ? nav : nav}
			{mode === 'about' ? <BlogAboutPage /> : null}
			{mode === 'admin-posts' ? <BlogAdminPostsPage /> : null}
			{mode === 'admin-tags' ? <BlogAdminTagsPage /> : null}
			{mode === 'detail' ? <BlogDetailPage /> : null}
			{mode === 'home' ? <HomeView /> : null}
		</>
	);
};

export default BlogPage;

