module.exports = {
  apps: [
    {
      name: 'association-vh',
      script: 'npm',
      args: 'start',
      cwd: '/home/deployer/apps/association-vh',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env.production',
      error_file: '/home/deployer/logs/association-vh-error.log',
      out_file: '/home/deployer/logs/association-vh-out.log',
      time: true,
      autorestart: true,
      max_memory_restart: '1G',
      watch: false,
      // Stratégie de redémarrage
      min_uptime: '10s',
      max_restarts: 10,
      // Monitoring
      combine_logs: true,
      merge_logs: true,
      // Gestion des signaux
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
}
