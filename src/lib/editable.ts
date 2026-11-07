import type { Attachment } from 'svelte/attachments';

/** Sætter indhold udefra uden at flytte markøren, mens feltet er i fokus. */
export function content(value: string, mode: 'html' | 'text' = 'html'): Attachment<HTMLElement> {
	return (node) => {
		if (document.activeElement === node) return;
		if (mode === 'html') {
			if (node.innerHTML !== value) node.innerHTML = value;
		} else if (node.textContent !== value) {
			node.textContent = value;
		}
	};
}

function escape(s: string) {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Indsæt kun ren tekst; tomme linjer bliver nye afsnit. */
export function pastePlain(e: ClipboardEvent) {
	const text = e.clipboardData?.getData('text/plain');
	if (text == null) return;
	e.preventDefault();
	const paras = text
		.replace(/\r\n?/g, '\n')
		.split(/\n\s*\n/)
		.map((p) => p.trim())
		.filter(Boolean);
	if (paras.length <= 1) {
		document.execCommand('insertText', false, text.trim());
		return;
	}
	document.execCommand(
		'insertHTML',
		false,
		paras.map((p) => `<p>${escape(p).replace(/\n/g, '<br>')}</p>`).join('')
	);
}

export function format(cmd: 'p' | 'h3' | 'blockquote' | 'bold' | 'italic' | 'ul' | 'ol') {
	switch (cmd) {
		case 'bold':
			return document.execCommand('bold');
		case 'italic':
			return document.execCommand('italic');
		case 'ul':
			return document.execCommand('insertUnorderedList');
		case 'ol':
			return document.execCommand('insertOrderedList');
		default:
			return document.execCommand('formatBlock', false, `<${cmd}>`);
	}
}
