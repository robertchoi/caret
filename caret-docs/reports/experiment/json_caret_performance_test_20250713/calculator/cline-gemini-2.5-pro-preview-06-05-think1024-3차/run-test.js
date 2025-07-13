// Mocking DOM environment for script.js
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div class="calculator">
    <input type="text" class="calculator-screen" value="0" disabled />
    <div class="calculator-keys"></div>
  </div>
</body>
</html>`);

global.document = dom.window.document;

// Load calculator logic
require('./script.js');

// Load and run tests
require('./script.test.js');
