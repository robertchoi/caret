function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let listType = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headers
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      if (level <= 6) {
        const text = line.substring(level).trim();
        html += `<h${level}>${text}</h${level}>\n`;
        continue;
      }
    }

    // Unordered List
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        if (inList) html += `</${listType}>`;
        html += '<ul>';
        inList = true;
        listType = 'ul';
      }
      let itemContent = line.substring(2);
      itemContent = itemContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      itemContent = itemContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html += `<li>${itemContent}</li>`;
      if (i === lines.length - 1 || (!lines[i + 1].startsWith('- ') && !lines[i + 1].startsWith('* '))) {
        html += '</ul>\n';
        inList = false;
      }
      continue;
    }

    // Ordered List
    if (line.match(/^\d+\.\s/)) {
      if (!inList || listType !== 'ol') {
        if (inList) html += `</${listType}>`;
        html += '<ol>';
        inList = true;
        listType = 'ol';
      }
      let itemContent = line.substring(line.indexOf('.') + 2);
      itemContent = itemContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      itemContent = itemContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
      html += `<li>${itemContent}</li>`;
      if (i === lines.length - 1 || !lines[i + 1].match(/^\d+\.\s/)) {
        html += '</ol>\n';
        inList = false;
      }
      continue;
    }
    
    if (inList) {
        html += `</${listType}>\n`;
        inList = false;
        listType = null;
    }

    // Bold and Italic
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Paragraphs
    if (line.trim().length > 0) {
      html += `<p>${line}</p>\n`;
    }
  }
  
  if (inList) {
    html += `</${listType}>`;
  }

  return html.replace(/\n/g, '').replace(/<\/ul><ul>/g, '').replace(/<\/ol><ol>/g, '');
}

if (typeof window !== 'undefined') {
  const markdownInput = document.getElementById('markdown-input');
  const htmlOutput = document.getElementById('html-output');

  markdownInput.addEventListener('keyup', () => {
    const markdownText = markdownInput.value;
    htmlOutput.innerHTML = parseMarkdown(markdownText);
  });
} else {
  module.exports = { parseMarkdown };
}
