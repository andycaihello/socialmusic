"""
Add audio URLs to songs for playback
Using free audio samples for demonstration
"""
from app import create_app
from app.extensions import db
from app.models.music import Song

app = create_app()

# 使用免费的音频样本URL
# 这些是公开的测试音频文件
audio_urls = {
    # 使用 Free Music Archive 和其他公开音频源
    # 注意：这些是示例URL，实际应用中需要使用合法的音乐源

    # 为所有歌曲分配测试音频（使用公开的测试音频）
    "default": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
}

with app.app_context():
    print("🎵 开始为歌曲添加音频URL...")

    songs = Song.query.all()
    updated_count = 0

    # 为所有歌曲添加默认测试音频
    for song in songs:
        # 使用不同的测试音频文件
        song_number = (song.id % 16) + 1
        song.external_url = f"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{song_number}.mp3"
        updated_count += 1
        print(f"✅ 更新: {song.title} - {song.artist.name}")

    db.session.commit()

    print(f"\n{'='*50}")
    print(f"🎉 音频URL更新完成！")
    print(f"{'='*50}")
    print(f"📊 统计：")
    print(f"   总歌曲数: {len(songs)}")
    print(f"   已添加音频: {updated_count}")
    print(f"{'='*50}")
    print(f"\n注意：使用的是 SoundHelix 提供的免费测试音频")
    print(f"实际应用中需要使用合法的音乐源")
