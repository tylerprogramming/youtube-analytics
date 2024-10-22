from flask import Flask, jsonify, request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from flask_cors import CORS, cross_origin  # Add this import
from datetime import timedelta
import isodate
import os

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "http://localhost:3005", 
        "methods": ["GET", "POST"], 
        "allow_headers": ["Content-Type"]
    }
})

# CORS(app)

# Your API key
API_KEY = os.getenv('YOUTUBE_API_KEY')

# Your channel ID
CHANNEL_ID = os.getenv('YOUTUBE_CHANNEL_ID')

app = Flask(__name__)

def get_youtube_service():
    return build('youtube', 'v3', developerKey=API_KEY)

def get_channel_id(youtube, channel_url):
    if channel_url.startswith(('https://www.youtube.com/', 'https://youtube.com/')):
        if '/@' in channel_url:
            channel_handle = channel_url.split('/@')[-1]
            channel_info = youtube.channels().list(
                part="id",
                forHandle=channel_handle
            ).execute()
            return channel_info['items'][0]['id']
        else:
            return channel_url.split('/')[-1]
    return channel_url  # Assume it's already a valid channel ID

def get_video_ids(youtube, channel_id, max_results):
    video_ids = []
    next_page_token = None
    while len(video_ids) < max_results:
        request = youtube.search().list(
            part="id",
            channelId=channel_id,
            type="video",
            order="date",  # This ensures we get the most recent videos first
            maxResults=min(50, max_results - len(video_ids)),
            pageToken=next_page_token
        )
        response = request.execute()
        video_ids.extend([item['id']['videoId'] for item in response.get('items', [])])
        next_page_token = response.get('nextPageToken')
        if not next_page_token or len(video_ids) >= max_results:
            break
    return video_ids[:max_results]

def parse_duration(duration_string):
    duration = isodate.parse_duration(duration_string)
    return str(timedelta(seconds=duration.total_seconds()))

@app.route('/', methods=['GET'])
def index():
    return 'Hello, World!'

@app.route('/api/channel_data', methods=['GET', 'POST', 'OPTIONS'])
@cross_origin(supports_credentials=True)
def get_channel_data():
    try:
        youtube = get_youtube_service()
        channel_url = request.args.get('channel_url', 'https://www.youtube.com/@TylerReedAI')
        video_count = request.args.get('video_count', 'all')
        
        channel_id = get_channel_id(youtube, channel_url)

        # Get channel statistics
        channel_response = youtube.channels().list(
            part="statistics,snippet,brandingSettings",
            id=channel_id
        ).execute()
        channel_data = channel_response['items'][0]

        # Determine how many videos to fetch
        if video_count == 'all':
            max_results = int(channel_data['statistics']['videoCount'])
        else:
            max_results = int(video_count)

        # Get video IDs
        video_ids = get_video_ids(youtube, channel_id, max_results)

        # Get detailed video information
        videos = []
        for i in range(0, len(video_ids), 50):  # Process in batches of 50
            batch_ids = video_ids[i:i+50]
            video_response = youtube.videos().list(
                part="snippet,contentDetails,statistics,topicDetails,status",
                id=','.join(batch_ids)
            ).execute()
            
            for item in video_response.get('items', []):
                video_data = {
                    'id': item['id'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'publishedAt': item['snippet']['publishedAt'],
                    'thumbnails': item['snippet']['thumbnails'],
                    'tags': item['snippet'].get('tags', []),
                    'categoryId': item['snippet']['categoryId'],
                    'duration': item['contentDetails']['duration'],
                    'durationFormatted': parse_duration(item['contentDetails']['duration']),
                    'viewCount': item['statistics'].get('viewCount', 'N/A'),
                    'likeCount': item['statistics'].get('likeCount', 'N/A'),
                    'commentCount': item['statistics'].get('commentCount', 'N/A'),
                    'topicCategories': item.get('topicDetails', {}).get('topicCategories', []),
                    'privacyStatus': item['status']['privacyStatus'],
                    'embeddable': item['status']['embeddable'],
                    'license': item['status']['license'],
                }
                videos.append(video_data)

        result = {
            'channel_info': {
                'id': channel_data['id'],
                'title': channel_data['snippet']['title'],
                'description': channel_data['snippet']['description'],
                'customUrl': channel_data['snippet'].get('customUrl'),
                'publishedAt': channel_data['snippet']['publishedAt'],
                'thumbnails': channel_data['snippet']['thumbnails'],
                'country': channel_data['snippet'].get('country'),
                'viewCount': channel_data['statistics']['viewCount'],
                'subscriberCount': channel_data['statistics']['subscriberCount'],
                'hiddenSubscriberCount': channel_data['statistics']['hiddenSubscriberCount'],
                'videoCount': channel_data['statistics']['videoCount'],
                'bannerImageUrl': channel_data['brandingSettings']['image'].get('bannerExternalUrl')
            },
            'videos': videos
        }

        return jsonify(result)
    except HttpError as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5005)