function markdownToHtml(markdown) {
    let html = markdown;

    // Store processed code blocks and inline code to prevent further parsing
    const codeBlockPlaceholders = [];
    const inlineCodePlaceholders = [];

    // 1. Handle code blocks first (multiline)
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
        const placeholder = `__CODE_BLOCK_${codeBlockPlaceholders.length}__`;
        codeBlockPlaceholders.push(`<pre><code>${escapeHtml(code.trim())}\n</code></pre>`);
        return placeholder;
    });

    // 2. Handle inline code (single line)
    html = html.replace(/`(.*?)`/g, (match, code) => {
        const placeholder = `__INLINE_CODE_${inlineCodePlaceholders.length}__`;
        inlineCodePlaceholders.push(`<code>${escapeHtml(code)}</code>`);
        return placeholder;
    });

    // 3. Links (must be before emphasis to avoid parsing link text as emphasis)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // 4. Emphasis (bold and italic) - bold first, then italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // 5. Headers (h1, h2, h3) - specific to general
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // 6. Lists (unordered and ordered)
    // Process lists line by line to handle multi-line list items and list termination
    const lines = html.split('\n');
    let processedLines = [];
    let inList = false;
    let listType = ''; // 'ul' or 'ol'

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmedLine = line.trim();

        const isUnorderedListItem = /^[-*]\s/.test(trimmedLine);
        const isOrderedListItem = /^\d+\.\s/.test(trimmedLine);

        // Check if the line is already a block-level HTML tag (e.g., <h1, <pre, <ul>, <ol>)
        const isHtmlBlockTag = /^(<h[1-3]|<pre>|<ul|<ol)/.test(trimmedLine);

        if (isUnorderedListItem || isOrderedListItem) {
            const currentListType = isUnorderedListItem ? 'ul' : 'ol';
            if (!inList || listType !== currentListType) {
                if (inList) { // Close previous list if type changes
                    processedLines.push(`</${listType}>`);
                }
                processedLines.push(`<${currentListType}>`);
                inList = true;
                listType = currentListType;
            }
            processedLines.push(`<li>${trimmedLine.substring(trimmedLine.indexOf(' ') + 1)}</li>`);
        } else {
            if (inList) { // End of list
                processedLines.push(`</${listType}>`);
                inList = false;
                listType = '';
            }

            // Paragraphs - only add if line is not empty and not already a block element
            if (trimmedLine.length > 0 && !isHtmlBlockTag) {
                processedLines.push(`<p>${trimmedLine}</p>`);
            }
        }
    }

    // Close any open list at the end of the document
    if (inList) {
        processedLines.push(`</${listType}>`);
    }

    html = processedLines.join('');

    // Remove any empty paragraph tags that might have been created
    html = html.replace(/<p>\s*<\/p>/g, '');

    // Restore code blocks
    codeBlockPlaceholders.forEach((block, index) => {
        html = html.replace(`__CODE_BLOCK_${index}__`, block);
    });

    // Restore inline code
    inlineCodePlaceholders.forEach((code, index) => {
        html = html.replace(`__INLINE_CODE_${index}__`, code);
    });

    // Final pass to handle paragraphs separated by multiple newlines
    // This is a more robust way to ensure paragraphs are correctly formed.
    // Split by two or more newlines, then wrap non-block content in <p> tags.
    html = html.split(/\n{2,}/).map(block => {
        block = block.trim();
        if (block.length > 0 && !/^(<h[1-3]|<ul|<ol|<pre>|<a|<em|<strong|<code)/.test(block)) {
            return `<p>${block}</p>`;
        }
        return block;
    }).join('\n'); // Join with newline to preserve block separation

    // Remove any remaining empty lines that might have been left from splitting
    html = html.replace(/^\s*[\r\n]/gm, '');

    return html;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>')
        .replace(/"/g, '"')
        .replace(/'/g, '&#039;');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = markdownToHtml;
}
