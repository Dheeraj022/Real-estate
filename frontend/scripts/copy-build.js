const fs = require('fs');
const path = require('path');

// Source directory (.next)
const sourceDir = path.join(__dirname, '..', '.next');
// Destination directory (build)
const destDir = path.join(__dirname, '..', 'build');

// Check if .next exists
if (!fs.existsSync(sourceDir)) {
  console.log('⚠️  .next directory does not exist yet. This is normal if build is still running.');
  process.exit(0);
}

// Create build directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy .next to build (only essential files for Render)
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  if (!exists) return;
  
  const stats = fs.statSync(src);
  const isDirectory = stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    try {
      const items = fs.readdirSync(src);
      items.forEach((childItemName) => {
        // Skip trace files that might cause permission issues
        if (childItemName === 'trace') {
          return;
        }
        try {
          copyRecursiveSync(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          );
        } catch (err) {
          // Skip files that can't be copied (permission issues, etc.)
          console.log(`⚠️  Skipped ${childItemName}: ${err.message}`);
        }
      });
    } catch (err) {
      console.log(`⚠️  Could not read directory ${src}: ${err.message}`);
    }
  } else {
    try {
      fs.copyFileSync(src, dest);
    } catch (err) {
      console.log(`⚠️  Could not copy ${src}: ${err.message}`);
    }
  }
}

try {
  copyRecursiveSync(sourceDir, destDir);
  console.log('✓ Build directory created for Render deployment');
} catch (error) {
  console.error('Error creating build directory:', error.message);
  // Don't exit with error - let Render handle it
  process.exit(0);
}

