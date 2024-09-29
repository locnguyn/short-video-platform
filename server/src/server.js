import express from 'express';
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
    context: async (ctx, msg, args) => {
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
  app.use(cors({
    origin: '*',
    credentials: true
  }));

  app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).send('Something went wrong');
  });

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

  await mongoose.connect(process.env.MONGODB_URI);

  // const categories = [
  //   { name: "Action", description: "Fast-paced and exciting videos" },
  //   { name: "Comedy", description: "Humorous and entertaining content" },
  //   { name: "Education", description: "Informative and instructional videos" },
  //   { name: "Music", description: "Music videos and performances" },
  //   { name: "Gaming", description: "Video game playthroughs and reviews" }
  // ];

  // // Function to insert categories
  // async function insertCategories() {
  //   try {
  //     const result = await models.Category.insertMany(categories);
  //     console.log(`${result.length} categories inserted successfully`);
  //   } catch (error) {
  //     console.error("Error inserting categories:", error);
  //   } finally {
  //     mongoose.connection.close();
  //   }
  // }

  // // Run the insertion
  // insertCategories();

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
