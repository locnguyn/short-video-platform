import { gql } from "@apollo/client";

export const GET_USER_VIDEO = gql`
  query GetUserVideos($id: String!, $page: Int!, $limit: Int!) {
    getUserVideos(id: $id, page: $page, limit: $limit) {
        id
        thumbnailUrl
        views
        videoUrl
        likeCount
        isViewed
    }
  }
`;

export const GET_VIDEO_DETAILS = gql`
  query GetVideoDetails($id: ID!) {
    getVideo(id: $id) {
      id
      title
      videoUrl
      thumbnailUrl
      duration
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      prevVideo {
        id
      }
      nextVideo {
        id
      }
      user {
        id
        username
        profilePicture
        isFollowed
      }
    }
  }
`;

export const GET_RECOMMENDED_VIDEOS = gql`
  query GetRecommendedVideos($limit: Int!) {
    getRecommendedVideos(limit: $limit) {
      id
      title
      videoUrl
      thumbnailUrl
      category {
        name
      }
      tags
      likeCount
      views
      commentsCount
      savesCount
      engagementRate
      createdAt
      isViewed
      isLiked
      isSaved
      user {
        id
        username
        profilePicture
        isFollowed
        followerCount
      }
    }
  }
`
