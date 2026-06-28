module.exports = {
  apps: [
    {
      name: "momentum-backend",
      script: "./backend/src/server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5050
      }
    }
  ]
};
