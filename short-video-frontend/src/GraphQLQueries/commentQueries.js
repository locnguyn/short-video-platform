import { gql } from "@apollo/client";

export const ADD_COMMENT = gql`
mutation AddComment($videoId: ID!, $content: String!, $parentCommentId: ID) {
  addComment(videoId: $videoId, content: $content, parentCommentId: $parentCommentId) {
    id
    content
    user {
      id
      username
      profilePicture
    }
    level
    createdAt
    likeCount
  }
}
`;
