import { Card, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { getBlogState } from '../store/blogStorage';
import './index.less';

const BlogAboutPage = () => {
	const [state, setState] = useState(() => getBlogState());

	useEffect(() => {
		setState(getBlogState());
	}, []);

	const { author } = state;

	return (
		<Card bordered={false}>
			<div className='blog-about'>
				<div className='about-cover'>
					<img className='avatar' alt={author.name} src={author.avatarUrl} />
					<div>
						<div style={{ fontSize: 26, fontWeight: 800 }}>{author.name}</div>
						<div style={{ marginTop: 8, color: 'rgba(0,0,0,0.7)', lineHeight: 1.7 }}>{author.bio}</div>

						<div className='skill-list'>
							{author.skills.map((s) => (
								<Tag key={s} color='blue'>
									{s}
								</Tag>
							))}
						</div>

						<div className='social-list'>
							{author.socials.map((soc) => (
								<a key={soc.label} href={soc.url} target='_blank' rel='noreferrer'>
									{soc.label}
								</a>
							))}
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
};

export default BlogAboutPage;

