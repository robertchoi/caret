function parseMarkdown(markdown) {
    // 여러 줄의 마크다운을 개별 라인으로 분리
    const lines = markdown.trim().split('\n');

    let html = '';
    let inList = false;
    let listType = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // 헤더 (h1-h6)
        if (line.startsWith('#')) {
            const level = line.match(/^#+/)[0].length;
            if (level <= 6) {
                const content = line.slice(level).trim();
                html += `<h${level}>${content}</h${level}>`;
                continue;
            }
        }

        // 코드 블록 (```)
        if (line.startsWith('```')) {
            let codeBlockContent = '';
            i++; // 다음 줄로 이동
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeBlockContent += lines[i] + '\n';
                i++;
            }
    // 마지막 개행 문자 제거
    codeBlockContent = codeBlockContent.trim();
    html += `<pre><code>${codeBlockContent}</code></pre>`;
    continue;
}

        // 순서 없는 목록 (-)
        if (line.startsWith('- ')) {
            if (!inList || listType !== 'ul') {
                if (inList) html += `</${listType}>`; // 이전 리스트 닫기
                html += '<ul>';
                inList = true;
                listType = 'ul';
            }
            html += `<li>${line.slice(2).trim()}</li>`;
            if (i === lines.length - 1 || !lines[i + 1].startsWith('- ')) {
                html += '</ul>';
                inList = false;
            }
            continue;
        }

        // 순서 있는 목록 (1.)
        if (line.match(/^\d+\. /)) {
            if (!inList || listType !== 'ol') {
                if (inList) html += `</${listType}>`; // 이전 리스트 닫기
                html += '<ol>';
                inList = true;
                listType = 'ol';
            }
            html += `<li>${line.replace(/^\d+\. /, '').trim()}</li>`;
            if (i === lines.length - 1 || !lines[i + 1].match(/^\d+\. /)) {
                html += '</ol>';
                inList = false;
            }
            continue;
        }

        // 일반 텍스트 및 인라인 요소 처리
        if (line.trim()) {
            let paragraph = line;

            // 굵은 글씨 (**)
            paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // 기울임 글씨 (*)
            paragraph = paragraph.replace(/\*(.*?)\*/g, '<em>$1</em>');
            // 인라인 코드 (`)
            paragraph = paragraph.replace(/`(.*?)`/g, '<code>$1</code>');
            // 링크
            paragraph = paragraph.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
            // 이미지
            paragraph = paragraph.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');

            html += `<p>${paragraph}</p>`;
        }
    }

    // 생성된 HTML의 앞뒤 공백과 여러 줄을 한 줄로 합침
    return html.replace(/>\s+</g, '><').trim();
}

// 브라우저 환경에서 실행될 때 DOM 요소에 이벤트 리스너 추가
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const markdownInput = document.getElementById('markdown-input');
        const htmlOutput = document.getElementById('html-output');

        markdownInput.addEventListener('input', () => {
            const markdownText = markdownInput.value;
            const htmlText = parseMarkdown(markdownText);
            htmlOutput.innerHTML = htmlText;
        });
    });
}
