import { gql } from "@apollo/client";

export const SEARCH_QUERY = gql`
  query Search($query: String!, $page: Int!, $limit: Int!) {
    search(query: $query, page: $page, limit: $limit) {
      users {
        id
        username
        profilePicture
        followerCount
      }
      videos {
        id
        title
        views
        likeCount
        isViewed
        videoUrl
        thumbnailUrl
        tags
        user {
          username
          followerCount
          profilePicture
        }
      }
      totalUsers
      totalVideos
    }
  }
`;
