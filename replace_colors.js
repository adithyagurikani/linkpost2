const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace indigo, blue, purple with gray
      content = content.replace(/text-indigo-(\d+)/g, 'text-gray-$1');
      content = content.replace(/bg-indigo-(\d+)/g, 'bg-gray-$1');
      content = content.replace(/border-indigo-(\d+)/g, 'border-gray-$1');
      content = content.replace(/ring-indigo-(\d+)/g, 'ring-gray-$1');
      content = content.replace(/shadow-indigo-(\d+)/g, 'shadow-gray-$1');
      
      content = content.replace(/text-blue-(\d+)/g, 'text-gray-$1');
      content = content.replace(/bg-blue-(\d+)/g, 'bg-gray-$1');
      content = content.replace(/border-blue-(\d+)/g, 'border-gray-$1');
      content = content.replace(/ring-blue-(\d+)/g, 'ring-gray-$1');
      content = content.replace(/shadow-blue-(\d+)/g, 'shadow-gray-$1');

      content = content.replace(/text-purple-(\d+)/g, 'text-gray-$1');
      content = content.replace(/bg-purple-(\d+)/g, 'bg-gray-$1');
      content = content.replace(/border-purple-(\d+)/g, 'border-gray-$1');
      content = content.replace(/ring-purple-(\d+)/g, 'ring-gray-$1');
      content = content.replace(/shadow-purple-(\d+)/g, 'shadow-gray-$1');
      
      // Mute the greens and reds for a more monochromatic, professional feel
      // (Replacing 500/600 with darker greys, and 50/100 with lighter greys)
      content = content.replace(/bg-green-500/g, 'bg-black');
      content = content.replace(/text-green-500/g, 'text-black');
      content = content.replace(/bg-green-50/g, 'bg-gray-100');
      content = content.replace(/text-green-600/g, 'text-gray-900');
      content = content.replace(/border-green-100/g, 'border-gray-300');
      content = content.replace(/border-green-200/g, 'border-gray-300');
      content = content.replace(/text-green-700/g, 'text-gray-900');
      content = content.replace(/bg-green-100/g, 'bg-gray-200');

      // Adjust some specific black/white contrast elements
      content = content.replace(/text-gray-600 hover:bg-gray-50 hover:text-black/g, 'text-gray-500 hover:text-black');

      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

targetDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    processDirectory(fullPath);
  }
});

console.log('Successfully applied greyscale aesthetic to the codebase.');
