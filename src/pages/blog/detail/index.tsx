import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Tag } from 'antd';
import type { BlogPost } from '../store/types';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'umi';
import { useLocation } from 'react-router-dom';
import { getBlogState, getPostBySlug, incrementView, getViewCount } from '../store/blogStorage';
import { getPostSummary, getTagsByIds, formatDateVi } from '../utils/blogHelpers';
import MarkdownRenderer from '../components/MarkdownRenderer';
import './index.less';

function getQueryParam(search: string, key: string) {
	try {
		return new URLSearchParams(search).get(key);
	} catch {
		return null;
	}
}

const BlogDetailPage = () => {
	const location = useLocation();
	const slug = getQueryParam(location.search, 'slug') ?? '';
	const allowDraft = getQueryParam(location.search, 'allowDraft') === '1';

	const [state, setState] = useState(() => getBlogState());
	const [currentPost, setCurrentPost] = useState<BlogPost | undefined>(() => (slug ? getPostBySlug(slug) : undefined));

	useEffect(() => {
		const s = getBlogState();
		setState(s);
		const post = slug ? s.posts.find((p) => p.slug === slug) : undefined;
		setCurrentPost(post);
	}, [slug]);

	useEffect(() => {
		if (!currentPost) return;
		// Hệ thống chỉ tăng view cho người xem thường hoặc khi admin bật preview draft.
		// Nếu post là draft và không cho phép preview thì không tính view.
		const isPublished = String(currentPost.status).toLowerCase() === 'published';
		if (isPublished || allowDraft) {
			incrementView(currentPost.id);
			setState(getBlogState());
		}
	}, [currentPost?.id]);

	const relatedPosts = useMemo(() => {
		if (!currentPost) return [];
		const published = state.posts.filter(
			(p) => String(p.status).toLowerCase() === 'published' && p.id !== currentPost.id,
		);
		const currentTags = new Set(currentPost.tagIds);
		const list = published.filter((p) => p.tagIds.some((id) => currentTags.has(id)));
		list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
		return list.slice(0, 3);
	}, [state.posts, currentPost]);

	if (!currentPost) {
		return (
			<div>
				<Link to='/blog'>
					<Button icon={<ArrowLeftOutlined />}>Quay lại danh sách</Button>
				</Link>
				<div style={{ marginTop: 24 }}>
					<Empty description='Không tìm thấy bài viết' />
				</div>
			</div>
		);
	}

	const isPublished = String(currentPost.status).toLowerCase() === 'published';
	if (!isPublished && !allowDraft) {
		return (
			<div className='blog-detail'>
				<div className='blog-detail-back'>
					<Link to='/blog'>
						<Button icon={<ArrowLeftOutlined />}>Quay lại danh sách</Button>
					</Link>
				</div>
				<Card bordered={false}>
					<Empty description='Bài viết đang ở trạng thái Nháp (chưa được đăng).' />
				</Card>
			</div>
		);
	}

	const tags = getTagsByIds(state.tags, currentPost.tagIds);
	const viewCount = getViewCount(currentPost.id);

	return (
		<div className='blog-detail'>
			<div className='blog-detail-back'>
				<Link to='/blog'>
					<Button icon={<ArrowLeftOutlined />}>Quay lại danh sách</Button>
				</Link>
			</div>

			<Card
				bordered={false}
				cover={
					currentPost.featuredImageUrl ? (
						<img className='blog-detail-cover' alt={currentPost.title} src={currentPost.featuredImageUrl} />
					) : undefined
				}
			>
				<div className='blog-detail-title'>{currentPost.title}</div>

				<div className='blog-detail-meta'>
					<span>{formatDateVi(currentPost.createdAt)}</span>
					<span>•</span>
					<span>Tác giả: {state.author.name}</span>
					<span>•</span>
					<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<EyeOutlined /> {viewCount} lượt xem
					</span>
				</div>

				<div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
					{tags.map((t) => (
						<Tag key={t.id}>{t.name}</Tag>
					))}
				</div>

				<div style={{ marginTop: 16 }}>
					<MarkdownRenderer markdown={currentPost.content} />
				</div>
			</Card>

			<div className='blog-detail-related'>
				<div style={{ fontWeight: 700, marginBottom: 10 }}>Bài viết liên quan</div>
				{relatedPosts.length === 0 ? (
					<Empty description='Chưa có bài liên quan' />
				) : (
					<Row gutter={[16, 16]}>
						{relatedPosts.map((p) => (
							<Col key={p.id} xs={24} sm={12} md={8}>
								<Card
									hoverable
									bordered
									cover={
										p.featuredImageUrl ? (
											<img alt={p.title} style={{ height: 140, objectFit: 'cover' }} src={p.featuredImageUrl} />
										) : undefined
									}
								>
									<div style={{ fontWeight: 650 }}>
										<Link to={`/blog?mode=detail&slug=${encodeURIComponent(p.slug)}`}>{p.title}</Link>
									</div>
									<div style={{ marginTop: 10, color: 'rgba(0,0,0,0.65)' }}>{getPostSummary(p)}</div>
									<div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
										{getTagsByIds(state.tags, p.tagIds).slice(0, 3).map((t) => (
											<Tag key={t.id}>{t.name}</Tag>
										))}
									</div>
								</Card>
							</Col>
						))}
					</Row>
				)}
			</div>
		</div>
	);
};

export default BlogDetailPage;

