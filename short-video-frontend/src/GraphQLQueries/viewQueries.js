import { gql } from "@apollo/client";

export const VIEW_VIDEO = gql`
  mutation ViewVideo($videoId: ID!) {
    viewVideo(videoId: $videoId)
  }
`;
