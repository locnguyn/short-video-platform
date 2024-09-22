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
import { verifyToken } from './utils/jwtTokenUtils.js';
import models from './models/index.js';

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(morgan('combined'));
  app.use(graphqlUploadExpress());
  app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  }));

  app.use('/api', videoRouter)
  app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).send('Something went wrong');
  });

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      console.log(req.body)
      const token = req.headers.authorization || '';
      let user = null;
      let tokenError = null;

      if (token) {
        const { valid, error, decoded } = verifyToken(token);
        if (valid) {
          user = { id: decoded.userId };
          console.log(user)
        } else {
          tokenError = error;
        }
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
