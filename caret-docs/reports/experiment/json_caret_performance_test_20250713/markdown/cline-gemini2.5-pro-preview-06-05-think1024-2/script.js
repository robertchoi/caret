function parseMarkdown(markdown) {
  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let inOrderedList = false;
  let inBlockquote = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code Blocks (```)
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        html += '</code></pre>';
        inCodeBlock = false;
      } else {
        html += '<pre><code>';
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      // Trim trailing newline if it's the last line of the code block
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.startsWith('```')) {
        html += line;
      } else {
        html += line + '\n';
      }
      continue;
    }

    // Headers (#)
    if (line.startsWith('#')) {
      const level = line.match(/^#+/)[0].length;
      if (level <= 6) {
        const text = line.substring(level).trim();
        html += `<h${level}>${text}</h${level}>`;
        continue;
      }
    }

    // Horizontal Rules (---, ***, ___)
    if (line.match(/^(---|___|\*\*\*)$/)) {
      html += '<hr>';
      continue;
    }

    // Blockquotes (>)
    if (line.startsWith('>')) {
        if (!inBlockquote) {
            html += '<blockquote>';
            inBlockquote = true;
        }
        html += `<p>${line.substring(1).trim()}</p>`;
        if (i + 1 >= lines.length || !lines[i + 1].startsWith('>')) {
            html += '</blockquote>';
            inBlockquote = false;
        }
        continue;
    }


    // Unordered Lists (*, +, -)
    if (line.match(/^(\*|\+|-)\s/)) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${line.substring(2)}</li>`;
      if (i + 1 >= lines.length || !lines[i + 1].match(/^(\*|\+|-)\s/)) {
        html += '</ul>';
        inList = false;
      }
      continue;
    }

    // Ordered Lists (1.)
    if (line.match(/^\d+\.\s/)) {
      if (!inOrderedList) {
        html += '<ol>';
        inOrderedList = true;
      }
      html += `<li>${line.substring(line.indexOf('.') + 2)}</li>`;
      if (i + 1 >= lines.length || !lines[i + 1].match(/^\d+\.\s/)) {
        html += '</ol>';
        inOrderedList = false;
      }
      continue;
    }

    // Close any open lists if the pattern breaks
    if (inList && !line.match(/^(\*|\+|-)\s/)) {
        html += '</ul>';
        inList = false;
    }
    if (inOrderedList && !line.match(/^\d+\.\s/)) {
        html += '</ol>';
        inOrderedList = false;
    }


    // Images and Links
    line = line.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
    line = line.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

    // Emphasis
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/__(.*?)__/g, '<strong>$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    line = line.replace(/_(.*?)_/g, '<em>$1</em>');

    // Paragraphs
    if (line.trim()) {
      html += `<p>${line}</p>`;
    }
  }

  // In a Node.js environment (like Jest), we can't use the DOM.
  // The logic is simplified for the test environment.
  // A more robust solution would use a library like JSDOM to fully simulate the DOM.
  if (typeof window === 'undefined') {
    return html.replace(/<\/ul>\s*<ul>/g, '').replace(/<\/ol>\s*<ol>/g, '');
  }

  // Browser-side cleanup using the DOM to correctly merge lists
  const tempContainer = document.createElement('div');
  tempContainer.innerHTML = html;

  let currentList = null;
  const children = Array.from(tempContainer.childNodes);
  tempContainer.innerHTML = ''; // Clear for rebuilding

  for (const node of children) {
    if (node.tagName === 'UL' || node.tagName === 'OL') {
      if (currentList && currentList.tagName === node.tagName) {
        // Merge into current list
        while (node.firstChild) {
          currentList.appendChild(node.firstChild);
        }
      } else {
        // Start a new list
        currentList = node;
        tempContainer.appendChild(currentList);
      }
    } else {
      currentList = null; // Reset list tracking
      tempContainer.appendChild(node);
    }
  }

  return tempContainer.innerHTML;
}

// This part runs only in the browser
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const markdownInput = document.getElementById('markdown-input');
    const htmlOutput = document.getElementById('html-output');

    if (markdownInput && htmlOutput) {
        markdownInput.addEventListener('keyup', () => {
            const markdownText = markdownInput.value;
            const htmlText = parseMarkdown(markdownText);
            htmlOutput.innerHTML = htmlText;
        });
    }
}

// This part is for Node.js testing
if (typeof module !== 'undefined') {
  module.exports = { parseMarkdown };
}
