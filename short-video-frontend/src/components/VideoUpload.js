import { gql, useQuery } from '@apollo/client';

const GET_ALL_POSTS = gql`
  query GetAllPosts {
    getAllPosts {
      id
      title
      content
      author {
        username
      }
    }
  }
`;

function PostList() {
    const { loading, error, data } = useQuery(GET_ALL_POSTS);
    if (error) return (
        <div>
            <p>Error: {error.message}</p>
            {error.graphQLErrors?.map(({ message }, i) => (
                <p key={i}>GraphQL error: {message}</p>
            ))}
            {error.networkError && <p>Network error: {error.networkError.message}</p>}
        </div>
    );
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error :(</p>;


    return data.getAllPosts.map(({ id, title, content, author }) => (
        <div key={id}>
            <h3>{title}</h3>
            <p>{content}</p>
            <small>By: {author.username}</small>
        </div>
    ));
}

export default PostList
