import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Localhost Cross-Origin Telemetry Bus Relay (/ __aura_bus)
 * Bridges ports 5173 (astronaut-hud) and 5174 (suit-simulator) via SSE + POST
 * because browser BroadcastChannel & localStorage are isolated per-port.
 */
function auraTelemetryRelayPlugin(): Plugin {
  const clients = new Set<any>();
  const latestByType = new Map<string, string>();

  const attachMiddleware = (middlewares: any) => {
    middlewares.use('/__aura_bus', (req: any, res: any) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      if (req.method === 'GET') {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        res.write(': connected\n\n');

        for (const payload of latestByType.values()) {
          res.write(`data: ${payload}\n\n`);
        }

        clients.add(res);
        req.on('close', () => {
          clients.delete(res);
        });
        return;
      }

      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const msgType = parsed?.msg?.type || parsed?.type;
            if (msgType) {
              latestByType.set(msgType, body);
            }
            for (const client of clients) {
              client.write(`data: ${body}\n\n`);
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false }));
          }
        });
        return;
      }

      res.statusCode = 405;
      res.end();
    });
  };

  return {
    name: 'aura-telemetry-relay',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), auraTelemetryRelayPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
