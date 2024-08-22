import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import typeDefs from './schema/index.js';
import resolvers from './resolvers/index.js';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import cors from 'cors'
import http from 'http';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';

import videoRouter from './Router/videoRouter.js'

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(morgan('combined'));
  app.use(graphqlUploadExpress());
  app.use(cors({
    origin: 'http://localhost:3000', // Replace with your client's URL
    credentials: true
  }));

  app.use('/api', videoRouter)

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || '';
      let user = null;
      try {
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          user = { id: decoded.userId };
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
      return { user };
    },
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  server.applyMiddleware({
    app,
    cors: false, // Disable Apollo Server's default CORS settings
  });

  await mongoose.connect(process.env.MONGODB_URI);

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
