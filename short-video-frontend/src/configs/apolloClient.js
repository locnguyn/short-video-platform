import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getToken } from '../utils/tokenUtils.js'

import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';

const httpLink = createUploadLink({
  uri: 'http://localhost:4000/graphql',
  headers: {
    'Apollo-Require-Preflight': 'true',
  },
});

const authLink = setContext((_, { headers }) => {
  const token = getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `${token}` : "",
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

export default client;
