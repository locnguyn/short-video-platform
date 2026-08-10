<div align="center" id="top">
  <h1>LocXoc Short Video Platform</h1>
</div>

<p align="center">
  <img alt="Github top language" src="https://img.shields.io/github/languages/top/locnguyn/short-video-platform?color=56BEB8">

  <img alt="Github language count" src="https://img.shields.io/github/languages/count/locnguyn/short-video-platform?color=56BEB8">

  <img alt="Repository size" src="https://img.shields.io/github/repo-size/locnguyn/short-video-platform?color=56BEB8">

  <!-- <img alt="Github issues" src="https://img.shields.io/github/issues/locnguyn/short-video-platform?color=56BEB8" /> -->

  <img alt="Github forks" src="https://img.shields.io/github/forks/locnguyn/short-video-platform?color=56BEB8" />

  <img alt="Github stars" src="https://img.shields.io/github/stars/locnguyn/short-video-platform?color=56BEB8" />
</p>

<!-- Status -->

<!-- <h4 align="center">
	🚧  Loc_Portfolio 🚀 Under construction...  🚧
</h4>

<hr> -->

<p align="center">
  <a href="#dart-about">About</a> &#xa0; | &#xa0;
  <a href="#sparkles-features">Features</a> &#xa0; | &#xa0;
  <a href="#rocket-technologies">Technologies</a> &#xa0; | &#xa0;
  <a href="#white_check_mark-requirements">Requirements</a> &#xa0; | &#xa0;
  <a href="#checkered_flag-starting">Starting</a> &#xa0; | &#xa0;
  <a href="#memo-license">License</a> &#xa0; | &#xa0;
  <a href="https://github.com/locnguyn" target="_blank">Author</a>
</p>

<br>

## :dart: About ##

A short video platform (TikTok-style) that lets users upload videos, browse a
personalised feed, and interact with videos and other users in real time.

## :sparkles: Features ##

:heavy_check_mark: Đăng ký / đăng nhập bằng JWT;\
:heavy_check_mark: Upload video lên AWS S3 (multipart upload);\
:heavy_check_mark: Feed dạng swipe: For You / Following / Friends;\
:heavy_check_mark: Like, lưu, bình luận (có bình luận lồng nhau);\
:heavy_check_mark: Follow / unfollow, trang profile với lazy loading;\
:heavy_check_mark: Chat 1-1 realtime qua GraphQL Subscriptions (WebSocket);\
:heavy_check_mark: Thông báo realtime (like, comment, follow, video mới);\
:heavy_check_mark: Tìm kiếm user và video bằng MongoDB full-text search;

## :rocket: Technologies ##

The following tools were used in this project:

**Frontend**

- [React 18](https://react.dev/) + [React Router 6](https://reactrouter.com/)
- [Apollo Client](https://www.apollographql.com/docs/react/) (queries, mutations, subscriptions)
- [MUI 5](https://mui.com/)

**Backend**

- [Node.js](https://nodejs.org/en/) + [Express](https://expressjs.com/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) + [GraphQL](https://graphql.org/learn/)
- [graphql-ws](https://github.com/enisdenjo/graphql-ws) cho subscriptions
- [MongoDB](https://www.mongodb.com/) + [Mongoose](https://mongoosejs.com/)
- [AWS S3](https://aws.amazon.com/s3/) để lưu video
- [JWT](https://github.com/auth0/node-jsonwebtoken) cho xác thực

## :white_check_mark: Requirements ##

Before starting :checkered_flag:, you need to have installed:

- [Git](https://git-scm.com)
- [Node](https://nodejs.org/en/) 20 trở lên
- Một MongoDB instance (local hoặc [MongoDB Atlas](https://www.mongodb.com/atlas))
- Một S3 bucket + IAM credentials nếu muốn dùng chức năng upload video

## :checkered_flag: Starting ##

```bash
# Clone this project
$ git clone https://github.com/locnguyn/short-video-platform
$ cd short-video-platform
```

### Backend

```bash
$ cd server
$ npm install

# Tạo file .env từ mẫu rồi điền giá trị thật
$ cp .env.example .env

$ npm start     # chạy server
$ npm test      # chạy test
```

### Frontend

```bash
$ cd short-video-frontend
$ npm install

# Tạo file .env từ mẫu (mặc định đã trỏ về localhost:4000)
$ cp .env.example .env

$ npm start
```

Frontend chạy ở <http://localhost:3000>, backend ở <http://localhost:4000/graphql>.

### Biến môi trường

| Biến | Ở đâu | Mô tả |
| --- | --- | --- |
| `MONGODB_URI` | server | Chuỗi kết nối MongoDB (bắt buộc) |
| `JWT_SECRET` | server | Khoá ký JWT (bắt buộc) |
| `PORT` | server | Cổng server, mặc định `4000` |
| `CORS_ORIGINS` | server | Các origin được phép, cách nhau bằng dấu phẩy |
| `AWS_REGION` | server | Region của S3 bucket |
| `AWS_ACCESS_KEY_ID` | server | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | server | IAM secret key |
| `AWS_S3_BUCKET_NAME` | server | Tên bucket lưu video |
| `REACT_APP_GRAPHQL_HTTP_URI` | frontend | Endpoint GraphQL HTTP |
| `REACT_APP_GRAPHQL_WS_URI` | frontend | Endpoint GraphQL WebSocket |

## :memo: License ##


Made with :heart: by <a href="https://github.com/locnguyn" target="_blank">Loc Nguyen Xuan</a>

&#xa0;

<a href="#top">Back to top</a>
