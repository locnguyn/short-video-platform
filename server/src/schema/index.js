import { gql } from 'apollo-server-express';

const typeDefs = gql`
  scalar Upload
  type User {
    id: ID!
    username: String!
    email: String!
    profilePicture: String
    followers: [User!]!
    following: [User!]!
    videos: [Video!]!
    createdAt: String!
  }

  type Video {
    id: ID!
    user: User!
    title: String!
    videoUrl: String!
    thumbnailUrl: String
    category: String
    tags: [String!]!
    likes: [User!]
    views: Int!
    comments: [Comment!]!
    createdAt: String!
  }

  type Comment {
    id: ID!
    user: User!
    video: Video!
    content: String!
    likes: [User!]!
    createdAt: String!
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
    getVideo(id: ID!): Video
    getComments(videoId: ID!): [Comment!]!
    getRecommendedVideos(userId: ID!): [Video!]!
    searchVideos(keyword: String!): [Video!]!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Mutation {
    registerUser(username: String!, email: String!, password: String!): AuthPayload!
    loginUser(email: String!, password: String!): AuthPayload!
    updateUser(id: ID!, username: String, email: String, profilePicture: String): User!
    uploadVideo(title: String!, videoFile: Upload!, category: String, tags: [String!]): Video!
    likeVideo(userId: ID!, videoId: ID!): Video!
    addComment(userId: ID!, videoId: ID!, content: String!): Comment!
    followUser(followerId: ID!, followedId: ID!): User!
    sendMessage(senderId: ID!, receiverId: ID!, content: String!): Message!
  }

  type Subscription {
    newComment(videoId: ID!): Comment!
    newMessage(chatId: ID!): Message!
  }
`;

export default typeDefs;
