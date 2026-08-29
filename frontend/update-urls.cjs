const fs = require('fs');
const files = [
  'src/services/resultsService.ts',
  'src/services/passkeyService.ts',
  'src/services/hintService.ts',
  'src/services/adminService.ts'
];
const prefix = "${import.meta.env.VITE_API_URL || ''}";

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/`\/api\//g, '`' + prefix + '/api/');
  content = content.replace(/'\/api\//g, '`' + prefix + '/api/');
  
  fs.writeFileSync(file, content);
}
console.log('Done');
