import express from 'express';
import logger from './utils/logger.js';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import typeDefs from './schema/index.js';
import resolvers from './resolvers/index.js';
import morgan from 'morgan';
import cors from 'cors'
import http from 'http';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';

import { verifyToken } from './utils/jwtTokenUtils.js';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: '/graphql',
  });

  const serverCleanup = useServer({
    schema,
    context: async (ctx, _msg, _args) => {
      const token = ctx.connectionParams?.authorization || '';
      let user = null;
      let tokenError = null;

      if (token) {
        const { valid, error, decoded } = verifyToken(token);
        if (valid) {
          user = { id: decoded.userId };
        } else {
          tokenError = error;
        }
      }

      return { user, tokenError };
    },
  }, wsServer);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(morgan('combined'));
  app.use(graphqlUploadExpress());
  // Danh sách origin được phép, cấu hình qua biến môi trường CORS_ORIGINS
  // (phân tách bằng dấu phẩy). Không dùng '*' vì kết hợp với credentials: true
  // là không hợp lệ theo spec CORS và trình duyệt sẽ chặn request.
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, callback) {
      // Cho phép request không có origin (curl, health check, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin không được phép bởi CORS: ${origin}`));
    },
    credentials: true
  }));

  const server = new ApolloServer({
    schema,
    context: ({ req, connection }) => {
      if (connection) {
        // Đây là một WebSocket connection
        return connection.context;
      } else {
        const token = req.headers.authorization || '';
        let user = null;
        let tokenError = null;
        if (token) {
          const { valid, error, decoded } = verifyToken(token);
          if (valid) {
            user = { id: decoded.userId };
          } else {
            tokenError = error;
          }
        }
        return { user, tokenError };
      }
    },
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
    ],
  });

  await server.start();

  server.applyMiddleware({
    app,
    cors: false, // Disable Apollo Server's default CORS settings
  });

  // Error handler PHẢI đặt sau tất cả middleware/route, nếu không Express sẽ
  // không bao giờ gọi tới nó.
  app.use((err, req, res, next) => {
    logger.error('Express error:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Something went wrong'
        : err.message,
    });
  });

  await mongoose.connect(process.env.MONGODB_URI);

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

// Fail fast: thiếu biến môi trường bắt buộc thì dừng ngay thay vì lỗi mơ hồ lúc runtime.
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(
    `Thiếu biến môi trường bắt buộc: ${missingEnv.join(', ')}. ` +
    'Xem file .env.example để biết cách cấu hình.'
  );
  process.exit(1);
}

startServer().catch((error) => {
  logger.error('Không thể khởi động server:', error);
  process.exit(1);
});
