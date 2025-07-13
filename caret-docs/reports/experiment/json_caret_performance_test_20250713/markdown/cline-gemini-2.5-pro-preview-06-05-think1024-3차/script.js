function parseMarkdown(markdown) {
    const lines = markdown.split('\n');
    let html = '';
    let inUl = false;
    let inOl = false;

    for (const line of lines) {
        // 헤더
        if (line.startsWith('# ')) {
            html += `<h1>${line.substring(2)}</h1>`;
            continue;
        }
        if (line.startsWith('## ')) {
            html += `<h2>${line.substring(3)}</h2>`;
            continue;
        }
        if (line.startsWith('### ')) {
            html += `<h3>${line.substring(4)}</h3>`;
            continue;
        }

        // 순서 없는 목록
        if (line.startsWith('* ') || line.startsWith('- ')) {
            if (!inUl) {
                html += '<ul>';
                inUl = true;
            }
            html += `<li>${line.substring(2)}</li>`;
            continue;
        }
        if (inUl) {
            html += '</ul>';
            inUl = false;
        }

        // 순서 있는 목록
        if (line.match(/^\d+\. /)) {
            if (!inOl) {
                html += '<ol>';
                inOl = true;
            }
            html += `<li>${line.replace(/^\d+\. /, '')}</li>`;
            continue;
        }
        if (inOl) {
            html += '</ol>';
            inOl = false;
        }
        
        // 빈 줄은 단락 구분을 위해 사용
        if (line.trim() === '') {
            continue;
        }

        // 단락
        html += `<p>${line}</p>`;
    }

    if (inUl) html += '</ul>';
    if (inOl) html += '</ol>';

    // 인라인 요소들
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // 생성된 p 태그 안의 다른 블록 요소들 정리
    html = html.replace(/<p><(h[1-3]|ul|ol)>/g, '<$1>');
    html = html.replace(/<\/(h[1-3]|ul|ol)><\/p>/g, '</$1>');


    return html.trim();
}

document.addEventListener('DOMContentLoaded', () => {
    const markdownInput = document.getElementById('markdown-input');
    const htmlOutput = document.getElementById('html-output');

    if (markdownInput && htmlOutput) {
        markdownInput.addEventListener('input', () => {
            const markdownText = markdownInput.value;
            const html = parseMarkdown(markdownText);
            htmlOutput.innerHTML = html;
        });
    }
});
