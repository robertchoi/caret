function parseMarkdown(markdown) {
    const blocks = markdown.trim().split(/\n\n+/);

    const html = blocks.map(block => {
        // Headers
        if (block.match(/^#{1,6}\s/)) {
            const level = block.match(/^#+/)[0].length;
            const content = block.replace(/^#{1,6}\s/, '');
            return `<h${level}>${applyInlineStyles(content)}</h${level}>`;
        }

        // Unordered List
        if (block.match(/^\s*[\*\-\+]\s/)) {
            const items = block.split('\n').map(item => `<li>${applyInlineStyles(item.replace(/^\s*[\*\-\+]\s/, ''))}</li>`).join('');
            return `<ul>${items}</ul>`;
        }

        // Ordered List
        if (block.match(/^\s*\d\.\s/)) {
            const items = block.split('\n').map(item => `<li>${applyInlineStyles(item.replace(/^\s*\d\.\s/, ''))}</li>`).join('');
            return `<ol>${items}</ol>`;
        }

        // Paragraph (default)
        return `<p>${applyInlineStyles(block).replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}

function applyInlineStyles(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>');
}

// This part is for browser environment
if (typeof window !== 'undefined') {
    const markdownInput = document.getElementById('markdown-input');
    const htmlOutput = document.getElementById('html-output');

    markdownInput.addEventListener('input', () => {
        const markdownText = markdownInput.value;
        const htmlText = parseMarkdown(markdownText);
        htmlOutput.innerHTML = htmlText;
    });
}

// This part is for Node.js environment (for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseMarkdown };
}
