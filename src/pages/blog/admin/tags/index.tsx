import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, message, Modal, Popconfirm, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useMemo, useState } from 'react';
import { getBlogState, deleteTag, upsertTag } from '../../store/blogStorage';
import type { BlogTag } from '../../store/types';
import { makeId } from '@/utils/utils';
import './index.less';

type FormValues = {
	name: string;
};

const BlogAdminTagsPage = () => {
	const [state, setState] = useState(() => getBlogState());
	const [modalOpen, setModalOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [form] = Form.useForm<FormValues>();

	useEffect(() => {
		setState(getBlogState());
	}, []);

	const usageCount = useMemo(() => {
		const map = new Map<string, number>();
		state.posts.forEach((p) => {
			p.tagIds.forEach((id) => map.set(id, (map.get(id) ?? 0) + 1));
		});
		return map;
	}, [state.posts]);

	const tags = state.tags;

	const columns: ColumnsType<BlogTag> = [
		{
			title: 'Tên thẻ',
			dataIndex: 'name',
			key: 'name',
			render: (value) => <div style={{ fontWeight: 650 }}>{value}</div>,
		},
		{
			title: 'Đang dùng bởi',
			key: 'usedBy',
			width: 180,
			render: (_value, record) => <span>{usageCount.get(record.id) ?? 0} bài</span>,
		},
		{
			title: 'Hành động',
			key: 'actions',
			width: 220,
			render: (_value, record) => (
				<Space>
					<Button
						onClick={() => {
							setEditId(record.id);
							form.resetFields();
							form.setFieldsValue({ name: record.name });
							setModalOpen(true);
						}}
					>
						Sửa
					</Button>
					<Popconfirm
						title='Xác nhận xóa thẻ? (Thẻ sẽ được gỡ khỏi các bài viết đang dùng)'
						okText='Xóa'
						cancelText='Hủy'
						onConfirm={() => {
							deleteTag(record.id);
							setState(getBlogState());
							message.success('Đã xóa thẻ');
						}}
					>
						<Button danger>Xóa</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	const openAdd = () => {
		setEditId(null);
		form.resetFields();
		form.setFieldsValue({ name: '' });
		setModalOpen(true);
	};

	const handleSubmit = async () => {
		try {
			const values = await form.validateFields();
			const rawName = values.name.trim();
			if (!rawName) {
				message.error('Vui lòng nhập tên thẻ');
				return;
			}

			const normalized = rawName.toLowerCase();
			const exists = state.tags.find((t) => t.id !== editId && t.name.toLowerCase() === normalized);
			if (exists) {
				message.error('Tên thẻ đã tồn tại');
				return;
			}

			const now = new Date().toISOString();
			const id = editId ?? `tag-${makeId(10).toLowerCase()}`;
			const next: BlogTag = {
				id,
				name: rawName,
				createdAt: editId ? state.tags.find((t) => t.id === editId)?.createdAt ?? now : now,
				updatedAt: now,
			};

			upsertTag(next);
			setModalOpen(false);
			setEditId(null);
			setState(getBlogState());
			message.success('Lưu thẻ thành công');
		} catch {
			// validateFields throws
		}
	};

	return (
		<div className='blog-admin-tags'>
			<div className='toolbar'>
				<div>
					<Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>
						Thêm thẻ
					</Button>
				</div>
				<div style={{ color: 'rgba(0,0,0,0.55)' }}>
					Tổng số thẻ: <b>{tags.length}</b>
				</div>
			</div>

			<Table rowKey='id' columns={columns} dataSource={[...tags].sort((a, b) => a.name.localeCompare(b.name))} pagination={false} />

			<Modal
				title={editId ? 'Sửa thẻ' : 'Thêm thẻ mới'}
				visible={modalOpen}
				onCancel={() => setModalOpen(false)}
				onOk={handleSubmit}
				okText='Lưu'
				cancelText='Hủy'
				width={520}
			>
				<Form form={form} layout='vertical'>
					<Form.Item
						label='Tên thẻ'
						name='name'
						rules={[
							{ required: true, message: 'Vui lòng nhập tên thẻ' },
							{ max: 60, message: 'Tên thẻ tối đa 60 ký tự' },
						]}
					>
						<Input placeholder='Ví dụ: React' />
					</Form.Item>
					<div style={{ color: 'rgba(0,0,0,0.55)' }}>
						Tên thẻ sẽ được hiển thị trong thẻ bài viết và mục lọc trên trang chủ.
					</div>
				</Form>
			</Modal>
		</div>
	);
};

export default BlogAdminTagsPage;

