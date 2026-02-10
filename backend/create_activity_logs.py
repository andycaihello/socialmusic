"""Create user activity logs for testing friends feed"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app
from app.extensions import db
from app.models.log import UserBehaviorLog
from datetime import datetime, timedelta
import random

app = create_app()

with app.app_context():
    # 清除旧的play和like日志
    UserBehaviorLog.query.filter(
        UserBehaviorLog.action_type.in_(['play', 'like'])
    ).delete()
    db.session.commit()

    # 用户ID 2-9 (alice关注了一些用户)
    users = [3, 4, 5, 6, 7, 8, 9]  # bob, charlie, david, emma, frank, grace, henry
    songs = list(range(1, 31))  # 30首歌

    activities = []

    # 为每个用户创建一些活动
    for user_id in users:
        # 每个用户播放5-10首歌
        play_count = random.randint(5, 10)
        played_songs = random.sample(songs, play_count)

        for song_id in played_songs:
            # 随机时间（最近3天内）
            hours_ago = random.randint(1, 72)
            created_at = datetime.now() - timedelta(hours=hours_ago)

            log = UserBehaviorLog(
                user_id=user_id,
                action_type='play',
                song_id=song_id,
                duration=random.randint(60, 240),
                extra_data={},
                ip_address='127.0.0.1',
                user_agent='TestScript',
                created_at=created_at
            )
            activities.append(log)

        # 每个用户点赞3-6首歌
        like_count = random.randint(3, 6)
        liked_songs = random.sample(songs, like_count)

        for song_id in liked_songs:
            hours_ago = random.randint(1, 72)
            created_at = datetime.now() - timedelta(hours=hours_ago)

            log = UserBehaviorLog(
                user_id=user_id,
                action_type='like',
                song_id=song_id,
                extra_data={},
                ip_address='127.0.0.1',
                user_agent='TestScript',
                created_at=created_at
            )
            activities.append(log)

    # 批量插入
    db.session.bulk_save_objects(activities)
    db.session.commit()

    print(f"✓ Created {len(activities)} activity logs")
    print(f"  - Play logs: {sum(1 for a in activities if a.action_type == 'play')}")
    print(f"  - Like logs: {sum(1 for a in activities if a.action_type == 'like')}")
