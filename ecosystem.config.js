const isWin = process.platform === "win32";

module.exports = {
  apps: [
    {
      name: "paytrizz-backend",
      cwd: "./backend",
      script: isWin ? "./paytrizz-backend.exe" : "./paytrizz-backend",
      instances: 1, // PRD 5.5: Single instance fork mode required for in-memory SSE hub
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        APP_ENV: "production",
        PORT: "8080",
      },
    },
    {
      name: "paytrizz-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
