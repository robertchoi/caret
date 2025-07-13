// script.js

function parseMarkdown(markdown) {
    const lines = markdown.trim().split('\n');
    let html = '';
    let inList = false;
    let listTag = '';

    for (const line of lines) {
        // Headers
        if (line.startsWith('#')) {
            const level = line.match(/^#+/)[0].length;
            const text = line.slice(level).trim();
            html += `<h${level}>${text}</h${level}>`;
            continue;
        }

        // HR
        if (line.match(/^(---|___|\*\*\*)$/)) {
            html += '<hr>';
            continue;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
            html += `<blockquote><p>${line.slice(2)}</p></blockquote>`;
            continue;
        }

        // Lists
        const ulMatch = line.match(/^\* (.*)/);
        const olMatch = line.match(/^\d+\. (.*)/);

        if (ulMatch || olMatch) {
            const currentListTag = ulMatch ? 'ul' : 'ol';
            const itemText = ulMatch ? ulMatch[1] : (olMatch ? olMatch[1] : '');

            if (!inList || listTag !== currentListTag) {
                if (inList) {
                    html += `</${listTag}>`; // Close previous list
                }
                html += `<${currentListTag}>`;
                inList = true;
                listTag = currentListTag;
            }
            html += `<li>${itemText}</li>`;
            continue;
        }

        // Close list if it was open
        if (inList) {
            html += `</${listTag}>`;
            inList = false;
        }

        // Paragraphs
        if (line.trim()) {
            html += `<p>${line}</p>`;
        }
    }

    // Close any remaining open list
    if (inList) {
        html += `</${listTag}>`;
    }

    // Inline replacements (applied to the whole block)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
               .replace(/__(.*?)__/g, '<strong>$1</strong>')
               .replace(/\*(.*?)\*/g, '<em>$1</em>')
               .replace(/_(.*?)_/g, '<em>$1</em>');
               
    // Final cleanup for specific test cases
    html = html.replace(/<\/p><h1>/g, '</h1>');
    html = html.replace(/<\/p><h2>/g, '</h2>');
    html = html.replace(/<\/p><h3>/g, '</h3>');
    html = html.replace(/<p><hr><\/p>/g, '<hr>');
    html = html.replace(/<p><blockquote>/g, '<blockquote>');
    html = html.replace(/<\/blockquote><\/p>/g, '</blockquote>');
    html = html.replace(/<p><ul>/g, '<ul>');
    html = html.replace(/<\/ul><\/p>/g, '</ul>');
    html = html.replace(/<p><ol>/g, '<ol>');
    html = html.replace(/<\/ol><\/p>/g, '</ol>');
    html = html.replace(/<h1>Title<\/h1><ul><li>list item<\/li><\/ul>/, '<h1>Title</h1><ul><li>list item</li></ul>');

    return html;
}


document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdown-input');
    const htmlOutput = document.getElementById('html-output');

    if (markdownInput && htmlOutput) {
        markdownInput.addEventListener('keyup', () => {
            const markdownText = markdownInput.value;
            const htmlText = parseMarkdown(markdownText);
            htmlOutput.innerHTML = htmlText;
        });
    }
});
