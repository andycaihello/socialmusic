"""
Update all song covers with reliable image URLs
"""
from app import create_app
from app.extensions import db
from app.models.music import Song

app = create_app()

# 为所有歌曲分配封面图片
song_covers = {
    # 周杰伦
    "双截棍": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    "稻香": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "晴天": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    "爱在西元前": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    "简单爱": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    "七里香": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",

    # Taylor Swift
    "Shake It Off": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
    "Blank Space": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",
    "Love Story": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop",
    "Style": "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=400&fit=crop",

    # Ed Sheeran
    "Shape of You": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",
    "Perfect": "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=400&fit=crop",
    "Thinking Out Loud": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    "Castle on the Hill": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",

    # The Beatles
    "Hey Jude": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    "Let It Be": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    "Yesterday": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    "Come Together": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    "Something": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
    "Here Comes the Sun": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",

    # Queen
    "Bohemian Rhapsody": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop",
    "We Will Rock You": "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=400&fit=crop",
    "Don't Stop Me Now": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",
    "Love of My Life": "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=400&fit=crop",
    "You're My Best Friend": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",

    # Adele
    "Someone Like You": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "Hello": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    "Rolling in the Deep": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    "Set Fire to the Rain": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",

    # 林俊杰
    "江南": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    "曹操": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
    "修炼爱情": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",
    "因你而在": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop",
    "不为谁而作的歌": "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=400&fit=crop",

    # 邓紫棋
    "泡沫": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",
    "光年之外": "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=400&fit=crop",
    "倒数": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    "来自天堂的魔鬼": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",

    # Coldplay
    "Yellow": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    "Viva La Vida": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    "The Scientist": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    "Trouble": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    "Shiver": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",

    # Bruno Mars
    "Just The Way You Are": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",
    "Uptown Funk": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop",
    "Grenade": "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=400&fit=crop",
    "24K Magic": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",
    "That's What I Like": "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=400&fit=crop",
    "Finesse": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
}

with app.app_context():
    print("🎨 开始更新所有歌曲封面...")

    songs = Song.query.all()
    updated_count = 0
    missing_count = 0

    for song in songs:
        if song.title in song_covers:
            song.cover_url = song_covers[song.title]
            updated_count += 1
            print(f"✅ 更新: {song.title} - {song.artist.name}")
        else:
            missing_count += 1
            print(f"⚠️  未找到封面: {song.title}")

    db.session.commit()

    print(f"\n{'='*50}")
    print(f"🎉 封面更新完成！")
    print(f"{'='*50}")
    print(f"📊 统计：")
    print(f"   总歌曲数: {len(songs)}")
    print(f"   已更新封面: {updated_count}")
    print(f"   未找到封面: {missing_count}")
    print(f"{'='*50}")
