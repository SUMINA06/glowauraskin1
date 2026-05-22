const { spawn } = require("node:child_process");

const port = process.env.PORT || 4173;

const args = ["preview", "--host", "0.0.0.0", "--port", String(port)];

const child = spawn("vite", args, {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
