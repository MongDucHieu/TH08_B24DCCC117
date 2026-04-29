import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Popconfirm, Radio, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'umi';
import { deletePost, getBlogState, upsertPost } from '../../store/blogStorage';
import type { BlogPost, BlogStatus } from '../../store/types';
import { formatDateVi, getTagsByIds } from '../../utils/blogHelpers';
import { generateUniqueSlug } from '../../store/seed';
import { makeId } from '@/utils/utils';
import './index.less';

const { TextArea } = Input;

type StatusFilter = 'all' | BlogStatus;

type FormValues = {
	title: string;
	slug: string;
	content: string;
	featuredImageUrl: string;
	tagIds: string[];
	status: BlogStatus;
};

const STATUS_LABEL: Record<BlogStatus, string> = {
	draft: 'Nháp',
	published: 'Đã đăng',
};

const STATUS_TAG_COLOR: Record<BlogStatus, string> = {
	draft: 'gold',
	published: 'green',
};

const BlogAdminPostsPage = () => {
	const [state, setState] = useState(() => getBlogState());

	const [searchTitle, setSearchTitle] = useState('');
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

	const [modalOpen, setModalOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form] = Form.useForm<FormValues>();

	useEffect(() => {
		setState(getBlogState());
	}, []);

	const posts = state.posts;
	const tags = state.tags;

	const filtered = useMemo(() => {
		const keyword = searchTitle.trim().toLowerCase();
		let list = [...posts];
		if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
		if (keyword) list = list.filter((p) => p.title.toLowerCase().includes(keyword));
		list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
		return list;
	}, [posts, searchTitle, statusFilter]);

	const openAdd = () => {
		setEditId(null);
		form.resetFields();
		form.setFieldsValue({
			title: '',
			slug: '',
			content: '',
			featuredImageUrl: '',
			tagIds: [],
			status: 'draft',
		});
		setModalOpen(true);
	};

	const openEdit = (post: BlogPost) => {
		setEditId(post.id);
		form.resetFields();
		form.setFieldsValue({
			title: post.title,
			slug: post.slug,
			content: post.content,
			featuredImageUrl: post.featuredImageUrl,
			tagIds: post.tagIds,
			status: post.status,
		});
		setModalOpen(true);
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			const now = new Date().toISOString();
			const existingSlugs = state.posts.map((p) => p.slug);

			// Keep the requirement: slug is explicit field, but we still help uniqueness.
			const nextSlug = values.slug.trim() || generateUniqueSlug(values.title, existingSlugs);

			const slugOwner = state.posts.find((p) => p.slug === nextSlug);
			if (slugOwner && slugOwner.id !== editId) {
				message.error('Slug đã tồn tại. Vui lòng chọn slug khác.');
				return;
			}

			const id = editId ?? `post-${makeId(10).toLowerCase()}`;
			const createdAt = editId ? state.posts.find((p) => p.id === editId)?.createdAt ?? now : now;

			const next: BlogPost = {
				id,
				title: values.title.trim(),
				slug: nextSlug,
				content: values.content,
				featuredImageUrl: values.featuredImageUrl.trim(),
				tagIds: values.tagIds ?? [],
				status: values.status,
				authorId: state.author.id,
				createdAt,
				updatedAt: now,
			};

			upsertPost(next);
			setModalOpen(false);
			setEditId(null);
			setState(getBlogState());
			message.success('Lưu bài viết thành công');
		} catch {
			// validateFields will throw
		}
	};

	const columns: ColumnsType<BlogPost> = [
		{
			title: 'Tiêu đề',
			dataIndex: 'title',
			key: 'title',
			render: (value, record) => (
				<div style={{ fontWeight: 650, maxWidth: 360 }}>
					{value}
					<div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>({record.slug})</div>
				</div>
			),
		},
		{
			title: 'Trạng thái',
			dataIndex: 'status',
			key: 'status',
			width: 140,
			render: (value) => <Tag color={STATUS_TAG_COLOR[value]}>{STATUS_LABEL[value]}</Tag>,
		},
		{
			title: 'Thẻ',
			dataIndex: 'tagIds',
			key: 'tagIds',
			width: 260,
			render: (ids) => {
				const list = getTagsByIds(tags, ids);
				return (
					<div className='action-tags'>
						{list.map((t) => (
							<Tag key={t.id}>{t.name}</Tag>
						))}
					</div>
				);
			},
		},
		{
			title: 'Lượt xem',
			key: 'viewCount',
			width: 110,
			render: (_value, record) => <span>{state.viewCounts[record.id] ?? 0}</span>,
		},
		{
			title: 'Ngày tạo',
			dataIndex: 'createdAt',
			key: 'createdAt',
			width: 160,
			render: (value) => formatDateVi(value),
		},
		{
			title: 'Hành động',
			key: 'actions',
			width: 180,
			render: (_value, record) => (
				<Space>
					<Button onClick={() => openEdit(record)}>Sửa</Button>
					<Popconfirm
						title='Xác nhận xóa bài viết?'
						okText='Xóa'
						cancelText='Hủy'
						onConfirm={() => {
							deletePost(record.id);
							setState(getBlogState());
							message.success('Đã xóa bài viết');
						}}
					>
						<Button danger>Xóa</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div className='blog-admin-posts'>
			<div className='toolbar'>
				<Input
					allowClear
					style={{ width: 320, maxWidth: '100%' }}
					value={searchTitle}
					onChange={(e) => setSearchTitle(e.target.value)}
					placeholder='Tìm theo tiêu đề...'
				/>
				<Radio.Group value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
					<Radio value='all'>Tất cả</Radio>
					<Radio value='draft'>Nháp</Radio>
					<Radio value='published'>Đã đăng</Radio>
				</Radio.Group>

				<div style={{ marginLeft: 'auto' }}>
					<Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
						Thêm bài viết
					</Button>
				</div>
			</div>

			<Table rowKey='id' columns={columns} dataSource={filtered} pagination={false} />

			<Modal
				title={editId ? 'Sửa bài viết' : 'Thêm bài viết mới'}
				visible={modalOpen}
				onCancel={() => setModalOpen(false)}
				onOk={handleSubmit}
				okText='Lưu'
				cancelText='Hủy'
				width={900}
			>
				<Form form={form} layout='vertical'>
					<Form.Item
						label='Tiêu đề'
						name='title'
						rules={[
							{ required: true, message: 'Vui lòng nhập tiêu đề' },
							{ max: 200, message: 'Tiêu đề tối đa 200 ký tự' },
						]}
					>
						<Input />
					</Form.Item>

					<Form.Item label='Slug' name='slug' rules={[{ required: true, message: 'Vui lòng nhập slug' }]}>
						<Input />
					</Form.Item>

					<Form.Item
						label='Ảnh đại diện (URL)'
						name='featuredImageUrl'
						rules={[{ max: 500, message: 'URL quá dài' }]}
					>
						<Input placeholder='https://...' />
					</Form.Item>

					<Form.Item
						label='Nội dung (Markdown)'
						name='content'
						rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
					>
						<TextArea rows={10} placeholder='# Tiêu đề... (Markdown)' />
					</Form.Item>

					<Form.Item label='Thẻ' name='tagIds'>
						<Select mode='multiple' allowClear placeholder='Chọn thẻ'>
							{tags.map((t) => (
								<Select.Option key={t.id} value={t.id}>
									{t.name}
								</Select.Option>
							))}
						</Select>
					</Form.Item>

					<Form.Item label='Trạng thái' name='status' initialValue='draft'>
						<Radio.Group>
							<Radio value='draft'>Nháp</Radio>
							<Radio value='published'>Đã đăng</Radio>
						</Radio.Group>
					</Form.Item>

					<div style={{ marginTop: 12, color: 'rgba(0,0,0,0.55)' }}>
						<div>Gợi ý: Bạn có thể xem trước link chi tiết bằng slug.</div>
						<div style={{ marginTop: 4 }}>
							<Link
								to={`/blog?mode=detail&slug=${encodeURIComponent(form.getFieldValue('slug') || '')}&allowDraft=1`}
							>
								<Button type='link' onClick={() => {}} disabled={!form.getFieldValue('slug')}>
									Xem trước (nếu có slug)
								</Button>
							</Link>
						</div>
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default BlogAdminPostsPage;

