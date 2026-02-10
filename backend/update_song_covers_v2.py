"""
Update song covers with reliable image URLs
Using placeholder images from picsum.photos and other reliable sources
"""
from app import create_app
from app.extensions import db
from app.models.music import Song

app = create_app()

# 使用可靠的图片源
# 使用 placeholder 图片服务和其他可靠的CDN
song_covers = {
    # 周杰伦
    "稻香": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    "晴天": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "七里香": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",

    # Taylor Swift
    "Shake It Off": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    "Blank Space": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "Love Story": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",

    # Ed Sheeran
    "Shape of You": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    "Perfect": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
    "Thinking Out Loud": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",

    # The Beatles
    "Hey Jude": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "Let It Be": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    "Yesterday": "https://images.unsplash.com/photo-1458560871784-56d23406c091?w=400&h=400&fit=crop",

    # Queen
    "Bohemian Rhapsody": "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop",
    "We Will Rock You": "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&h=400&fit=crop",
    "Don't Stop Me Now": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400&h=400&fit=crop",

    # Adele
    "Someone Like You": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "Hello": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
    "Rolling in the Deep": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",

    # 林俊杰
    "江南": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    "曹操": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    "修炼爱情": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",

    # 邓紫棋
    "泡沫": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "光年之外": "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    "倒数": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",

    # Coldplay
    "Yellow": "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=400&fit=crop",
    "Viva La Vida": "https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop",
    "The Scientist": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=400&fit=crop",

    # Bruno Mars
    "Just The Way You Are": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    "Uptown Funk": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    "Grenade": "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
}

with app.app_context():
    print("🎨 开始更新歌曲封面（使用可靠图片源）...")

    songs = Song.query.all()
    updated_count = 0

    for song in songs:
        if song.title in song_covers:
            song.cover_url = song_covers[song.title]
            updated_count += 1
            print(f"✅ 更新: {song.title} - {song.artist.name}")
        else:
            print(f"⚠️  未找到封面: {song.title}")

    db.session.commit()

    print(f"\n{'='*50}")
    print(f"🎉 封面更新完成！")
    print(f"{'='*50}")
    print(f"📊 统计：")
    print(f"   总歌曲数: {len(songs)}")
    print(f"   已更新封面: {updated_count}")
    print(f"{'='*50}")
