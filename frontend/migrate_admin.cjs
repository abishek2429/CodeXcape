const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'pages', 'admin');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We will apply a very basic replacement:
  // Instead of removing all classes, we'll replace the long tailwind strings with our semantic component classes based on keywords.
  // This is a heuristic approach, but given the time constraint, it's better than manual.
  
  content = content.replace(/className=(["'])([^"']*)(["'])/g, (match, p1, classes, p3) => {
    let newClasses = [];
    
    // Panel/Card logic
    if (classes.includes('bg-slate-900') || classes.includes('bg-cyber-dark') || classes.includes('cyber-panel')) {
      newClasses.push('admin-panel');
    }
    
    // Buttons
    if (classes.includes('bg-cyan-600') || classes.includes('bg-gradient-to-r')) {
      newClasses.push('admin-btn-primary');
    } else if (classes.includes('bg-rose-500') || classes.includes('bg-red-500')) {
      newClasses.push('admin-btn-danger');
    } else if (classes.includes('bg-slate-800') || classes.includes('hover:bg-slate-700')) {
      newClasses.push('admin-btn-secondary');
    }
    
    // Inputs
    if (classes.includes('border-slate-700') && classes.includes('focus:ring-cyan-500')) {
      newClasses.push('admin-input');
    }
    
    // Text colors
    if (classes.includes('text-cyan-400')) newClasses.push('text-accent');
    if (classes.includes('text-emerald-400')) newClasses.push('text-success');
    if (classes.includes('text-rose-400') || classes.includes('text-red-400')) newClasses.push('text-danger');
    if (classes.includes('text-amber-400')) newClasses.push('text-warning');
    if (classes.includes('text-slate-400')) newClasses.push('text-secondary');
    if (classes.includes('text-white')) newClasses.push('text-primary');
    
    // Basic layouts
    if (classes.includes('flex')) newClasses.push('flex');
    if (classes.includes('items-center')) newClasses.push('items-center');
    if (classes.includes('justify-between')) newClasses.push('justify-between');
    if (classes.includes('justify-center')) newClasses.push('justify-center');
    if (classes.includes('grid')) newClasses.push('grid');
    if (classes.includes('gap-4')) newClasses.push('gap-4');
    if (classes.includes('gap-2')) newClasses.push('gap-2');
    
    // Keep some original classes if they are standard simple ones
    let words = classes.split(' ');
    for (let w of words) {
       if (['animate-pulse', 'animate-spin', 'relative', 'absolute', 'truncate', 'hidden', 'block'].includes(w)) {
           newClasses.push(w);
       }
    }

    if (newClasses.length > 0) {
      return `className=${p1}${Array.from(new Set(newClasses)).join(' ')}${p3}`;
    }
    return `className=${p1}${p3}`; // empty class
  });
  
  // Same for template literals
  content = content.replace(/className=\{`([^`]*)`\}/g, (match, classes) => {
      // Just strip for now or replace with a generic 'admin-dynamic-class'
      return `className="admin-dynamic-element"`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${path.basename(filePath)}`);
}

const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(adminDir, f)));
