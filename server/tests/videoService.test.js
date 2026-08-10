import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import models from '../src/models/index.js';
import videoService from '../src/services/videoService.js';

let mongoServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all(
    Object.values(mongoose.connection.collections).map((c) => c.deleteMany({}))
  );
});

const createUser = async (username) =>
  models.User.create({
    username,
    email: `${username}@example.com`,
    password: 'hashed-password',
  });

const createVideo = async (user, title) =>
  models.Video.create({ user: user._id, title, videoUrl: `https://cdn/${title}.mp4` });

const follow = async (follower, following) =>
  models.Follow.create({ follower: follower._id, following: following._id });

describe('videoService.getFollowingVideos', () => {
  it('trả về video của người mà user đang follow', async () => {
    const me = await createUser('me');
    const idol = await createUser('idol');
    await follow(me, idol);
    const video = await createVideo(idol, 'idol-video');

    // userId truyền vào dạng string, giống hệt giá trị lấy từ JWT payload.
    const result = await videoService.getFollowingVideos(me._id.toString(), 10);

    assert.equal(result.length, 1);
    assert.equal(result[0]._id.toString(), video._id.toString());
  });

  it('loại bỏ video mà user đã xem', async () => {
    const me = await createUser('me');
    const idol = await createUser('idol');
    await follow(me, idol);
    const seen = await createVideo(idol, 'seen');
    const unseen = await createVideo(idol, 'unseen');
    await models.View.create({ user: me._id, video: seen._id, viewCount: 1 });

    const result = await videoService.getFollowingVideos(me._id.toString(), 10);

    assert.equal(result.length, 1);
    assert.equal(result[0]._id.toString(), unseen._id.toString());
  });

  it('trả về mảng rỗng khi chưa follow ai', async () => {
    const me = await createUser('me');
    const result = await videoService.getFollowingVideos(me._id.toString(), 10);
    assert.deepEqual(result, []);
  });
});

describe('videoService.getFriendVideos', () => {
  it('chỉ trả về video của bạn bè (follow lẫn nhau)', async () => {
    const me = await createUser('me');
    const friend = await createUser('friend');
    const idolOnly = await createUser('idolonly');

    // Bạn bè: follow hai chiều
    await follow(me, friend);
    await follow(friend, me);
    // Không phải bạn bè: chỉ mình follow một chiều
    await follow(me, idolOnly);

    const friendVideo = await createVideo(friend, 'friend-video');
    await createVideo(idolOnly, 'one-way-video');

    const result = await videoService.getFriendVideos(me._id.toString(), 10);

    assert.equal(result.length, 1, 'chỉ được lấy video của bạn follow hai chiều');
    assert.equal(result[0]._id.toString(), friendVideo._id.toString());
  });

  it('loại bỏ video của bạn bè mà user đã xem', async () => {
    const me = await createUser('me');
    const friend = await createUser('friend');
    await follow(me, friend);
    await follow(friend, me);

    const seen = await createVideo(friend, 'seen');
    const unseen = await createVideo(friend, 'unseen');
    await models.View.create({ user: me._id, video: seen._id, viewCount: 3 });

    const result = await videoService.getFriendVideos(me._id.toString(), 10);

    assert.equal(result.length, 1);
    assert.equal(result[0]._id.toString(), unseen._id.toString());
  });

  it('trả về mảng rỗng khi không có ai follow lẫn nhau', async () => {
    const me = await createUser('me');
    const idol = await createUser('idol');
    await follow(me, idol);
    await createVideo(idol, 'one-way');

    const result = await videoService.getFriendVideos(me._id.toString(), 10);
    assert.deepEqual(result, []);
  });

  it('tôn trọng tham số limit', async () => {
    const me = await createUser('me');
    const friend = await createUser('friend');
    await follow(me, friend);
    await follow(friend, me);
    await createVideo(friend, 'v1');
    await createVideo(friend, 'v2');
    await createVideo(friend, 'v3');

    const result = await videoService.getFriendVideos(me._id.toString(), 2);
    assert.equal(result.length, 2);
  });
});
