import { memo } from 'react';
import { renderMarkdownToHtml } from '../utils/markdown';

const MarkdownRenderer = memo(function MarkdownRenderer(props: { markdown: string; className?: string }) {
	const html = renderMarkdownToHtml(props.markdown);

	return (
		<div
			className={props.className}
			dangerouslySetInnerHTML={{ __html: html }}
			style={{ lineHeight: 1.7 }}
		/>
	);
});

export default MarkdownRenderer;

