import { gql } from 'apollo-server-express';

const typeDefs = gql`
  scalar Upload
  scalar Date
  type User {
    id: ID!
    username: String!
    email: String!
    profilePicture: String
    videos: [Video!]!
    createdAt: String!
    followerCount: Int!
    followingCount: Int!
  }

  type FollowConnection {
    edges: [FollowEdge!]!
    pageInfo: PageInfo!
  }

  type FollowEdge {
    node: User!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type Category {
    id: ID!
    name: String!
    description: String!
  }

  type Video {
    id: ID!
    user: User!
    title: String!
    videoUrl: String!
    thumbnailUrl: String
    duration: Float!
    category: Category
    tags: [String!]!
    likeCount: Int!
    views: Int!
    commentsCount: Int!
    savesCount: Int!
    engagementRate: Float!
    createdAt: Date!
  }


  type Comment {
    id: ID!
    content: String!
    user: User!
    video: Video!
    parentComment: Comment
    replies: [Comment!]!
    level: Int!
    createdAt: String!
  }

  type Like {
    id: ID!
    user: User!
    targetType: String!
    target: LikeTarget!
    createdAt: Date!
  }

  union LikeTarget = Video | Comment

  type Follow {
    id: ID!
    follower: User!
    following: User!
    createdAt: Date!
  }

  type InteractionType {
    id: ID!
    name: String!
    description: String
  }

  type UserInteraction {
    id: ID!
    user: User!
    video: Video!
    interactionType: InteractionType!
    score: Float
    timestamp: Date!
  }

  type UserPreference {
    id: ID!
    user: User!
    category: Category!
    score: Float
  }

  type Recommendation {
    id: ID!
    user: User!
    video: Video!
    isViewed: Boolean!
  }

  type Save {
    id: ID!
    user: User!
    video: Video!
    createdAt: Date!
  }

  type Chat {
    id: ID!
    participants: [User!]!
    messages: [Message!]!
  }

  type Message {
    id: ID!
    sender: User!
    content: String!
    createdAt: String!
  }

  type Query {
    getUser(id: ID!): User
    getUserFollowers(userId: ID!, first: Int, after: String): FollowConnection!
    getUserFollowing(userId: ID!, first: Int, after: String): FollowConnection!
    getVideo(id: ID!): Video
    getComments(videoId: ID!): [Comment!]!
    getRecommendedVideos(userId: ID!): [Video!]!
    searchVideos(keyword: String!): [Video!]!
    getCategories: [Category!]!
    getUserInteractions(userId: ID!): [UserInteraction!]!
    getUserPreferences(userId: ID!): [UserPreference!]!
  }

  type Mutation {
    registerUser(username: String!, email: String!, password: String!, avatarFile: Upload): AuthPayload!
    loginUser(email: String!, password: String!): AuthPayload!
    updateUser(id: ID!, username: String, email: String, profilePicture: Upload): User!
    uploadVideo(title: String!, videoFile: Upload!, thumbnailFile: Upload, category: ID, tags: [String!]): Video!
    likeVideo(targetId: ID!): Boolean!
    unlikeVideo(targetId: ID!): Boolean!
    likeComment(targetId: ID!): Boolean!
    unlikeComment(targetId: ID!): Boolean!
    followUser(followingId: ID!): Boolean!
    unfollowUser(followingId: ID!): Boolean!
    addComment(videoId: ID!, content: String!, parentCommentId: ID): Comment!
    saveVideo(videoId: ID!): Save!
    unsaveVideo(videoId: ID!): Boolean!
    updateUserPreference(categoryId: ID!, score: Float!): UserPreference!
    recordUserInteraction(videoId: ID!, interactionTypeId: ID!, score: Float): UserInteraction!
  }

  type Subscription {
    newComment(videoId: ID!): Comment!
    newMessage(chatId: ID!): Message!
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;

export default typeDefs;
