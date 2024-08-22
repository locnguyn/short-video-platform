// const express = require('express');
// const { ApolloServer } = require('apollo-server-express');
// const mongoose = require('mongoose');
// const typeDefs = require('./schemas/typeDefs');
// const resolvers = require('./schemas/resolvers');
// const { authMiddleware } = require('./middleware/auth');

// async function startServer() {
//   const app = express();

//   app.use(authMiddleware);

//   const server = new ApolloServer({
//     typeDefs,
//     resolvers,
//     context: ({ req }) => {
//       return { user: req.user };
//     },
//   });

//   await server.start();

//   server.applyMiddleware({ app });

//   return app;
// }

// module.exports = startServer;
