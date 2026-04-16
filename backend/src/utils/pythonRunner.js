const path = require('path');
const { spawn } = require('child_process');

function runPythonScript(scriptRelativePath, payload = {}) {
  const pythonCmd = process.env.PYTHON_CMD || 'python';
  const scriptPath = path.join(process.cwd(), scriptRelativePath);

  return new Promise((resolve, reject) => {
    const child = spawn(pythonCmd, [scriptPath], {
      cwd: process.cwd(),
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderr || `Python script exited with code ${code}`));
      }

      try {
        const parsed = JSON.parse(stdout.trim() || '{}');
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Invalid Python output: ${stdout}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

module.exports = {
  runPythonScript
};
