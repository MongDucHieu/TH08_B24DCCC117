const tokenPrefix = '__BLOG_MD_TOKEN__';

function escapeHtml(text: string) {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function parseInline(text: string) {
	let s = text;

	// Links: [text](url)
	s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, url) => {
		const safeUrl = url.replace(/"/g, '&quot;');
		return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${label}</a>`;
	});

	// Strikethrough
	s = s.replace(/~~(.+?)~~/g, '<del>$1</del>');

	// Bold
	s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

	// Italic (keep after bold)
	s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');

	return s;
}

export function renderMarkdownToHtml(markdown: string) {
	if (!markdown) return '';

	let text = markdown.replace(/\r\n/g, '\n');
	const tokens: string[] = [];

	// 1) Extract code blocks first
	text = text.replace(/```([\s\S]*?)```/g, (_m, code) => {
		const normalized = code.replace(/^\n/, '').replace(/\n$/, '');
		const escaped = escapeHtml(normalized);
		const token = `${tokenPrefix}${tokens.length}__`;
		tokens.push(`<pre><code>${escaped}</code></pre>`);
		return token;
	});

	// 2) Extract inline code
	text = text.replace(/`([^`]+)`/g, (_m, code) => {
		const escaped = escapeHtml(code);
		const token = `${tokenPrefix}${tokens.length}__`;
		tokens.push(`<code>${escaped}</code>`);
		return token;
	});

	// 3) Escape remaining HTML
	text = escapeHtml(text);

	const lines = text.split('\n');

	let html = '';
	let currentList: 'ul' | 'ol' | null = null;
	let listItems: string[] = [];

	const flushList = () => {
		if (!currentList || listItems.length === 0) return;
		html += `<${currentList}>${listItems.join('')}</${currentList}>`;
		currentList = null;
		listItems = [];
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) {
			flushList();
			continue;
		}

		// Insert extracted tokens as-is (e.g. code blocks placeholders)
		const tokenLine = line.match(new RegExp(`^${tokenPrefix}(\\d+)__$`));
		if (tokenLine) {
			flushList();
			const idx = Number(tokenLine[1]);
			html += tokens[idx] ?? '';
			continue;
		}

		// Headings
		const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (hMatch) {
			flushList();
			const level = Math.min(6, hMatch[1].length);
			html += `<h${level}>${parseInline(hMatch[2])}</h${level}>`;
			continue;
		}

		// Blockquote (single line)
		const bqMatch = line.match(/^>\s+(.+)$/);
		if (bqMatch) {
			flushList();
			html += `<blockquote>${parseInline(bqMatch[1])}</blockquote>`;
			continue;
		}

		// Unordered list
		const ulMatch = line.match(/^[-*]\s+(.+)$/);
		if (ulMatch) {
			if (currentList !== 'ul') {
				flushList();
				currentList = 'ul';
			}
			listItems.push(`<li>${parseInline(ulMatch[1])}</li>`);
			continue;
		}

		// Ordered list
		const olMatch = line.match(/^\d+\.\s+(.+)$/);
		if (olMatch) {
			if (currentList !== 'ol') {
				flushList();
				currentList = 'ol';
			}
			listItems.push(`<li>${parseInline(olMatch[1])}</li>`);
			continue;
		}

		// Paragraph
		flushList();
		html += `<p>${parseInline(line)}</p>`;
	}

	flushList();

	// 4) Restore tokens
	html = html.replace(new RegExp(`${tokenPrefix}(\\d+)__`, 'g'), (_m, idx) => tokens[Number(idx)] ?? '');

	return html;
}

export function markdownToPlainText(markdown: string) {
	if (!markdown) return '';
	const withoutCodeBlocks = markdown.replace(/```([\s\S]*?)```/g, ' ');
	const withoutInlineCode = withoutCodeBlocks.replace(/`([^`]+)`/g, '$1');
	const withoutLinks = withoutInlineCode.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
	const withoutMarkdownSymbols = withoutLinks
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/^\>\s+/gm, '')
		.replace(/[-*]\s+/g, '')
		.replace(/\*\*(.+?)\*\*/g, '$1')
		.replace(/~~(.+?)~~/g, '$1')
		.replace(/\*(.+?)\*/g, '$1');

	return withoutMarkdownSymbols
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function getMarkdownSummary(markdown: string, limit: number = 160) {
	const plain = markdownToPlainText(markdown);
	if (plain.length <= limit) return plain;
	return plain.slice(0, limit).trim() + '...';
}

