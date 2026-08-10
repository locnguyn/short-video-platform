import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getToken } from '../utils/tokenUtils';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { setContext } from '@apollo/client/link/context';

// Endpoint được cấu hình qua biến môi trường để deploy được nhiều môi trường
// (dev / staging / production) mà không phải sửa code.
const HTTP_URI =
  process.env.REACT_APP_GRAPHQL_HTTP_URI || 'http://localhost:4000/graphql';
const WS_URI =
  process.env.REACT_APP_GRAPHQL_WS_URI || 'ws://localhost:4000/graphql';

const httpLink = createUploadLink({
  uri: HTTP_URI,
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

const wsLink = new GraphQLWsLink(createClient({
  url: WS_URI,
  connectionParams: () => {
    const token = getToken();
    return {
      authorization: token ? `${token}` : "",
    };
  },
}));

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: authLink.concat(splitLink),
  cache: new InMemoryCache()
});

export default client;
