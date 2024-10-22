"use client"

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// Define the type for the video object
interface Video {
  id: string;
  title: string;
  viewCount: number;
  likeCount: number;
  durationFormatted: string;
  publishedAt: string;
  [key: string]: any;
}

// Define the type for the channel info
interface ChannelInfo {
  title: string;
  viewCount: number;
  subscriberCount: number;
  videoCount: number;
  country?: string;
}

// Define the type for the channel data response
interface ChannelData {
  channel_info: ChannelInfo;
  videos: Video[];
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Add types to the props for the VideoDetails component
const VideoDetails: React.FC<{ video: Video }> = ({ video }) => (
  <div className="space-y-4">
    {Object.entries(video).map(([key, value]) => (
      <div key={key} className="grid grid-cols-3 gap-4">
        <span className="font-semibold">{key}:</span>
        <span className="col-span-2">
          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value.toString()}
        </span>
      </div>
    ))}
  </div>
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

const YouTubeDataDisplay: React.FC = () => {
  const [channelData, setChannelData] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching from:', `${API_URL}/api/channel_data?channel_url=https://www.youtube.com/@TylerReedAI&video_count=10`);
        const response = await fetch(`${API_URL}/api/channel_data?channel_url=https://www.youtube.com/@TylerReedAI&video_count=10`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('Response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`Network response was not ok: ${response.status} ${response.statusText}. ${errorText}`);
        }
        const data: ChannelData = await response.json();
        console.log('Received data:', data);
        setChannelData(data);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  if (!channelData) return null;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{channelData.channel_info.title}</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Total Views</h2>
          <p>{formatNumber(channelData.channel_info.viewCount)}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Subscribers</h2>
          <p>{formatNumber(channelData.channel_info.subscriberCount)}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Video Count</h2>
          <p>{formatNumber(channelData.channel_info.videoCount)}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Country</h2>
          <p>{channelData.channel_info.country || 'N/A'}</p>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Views</TableHead>
            <TableHead>Likes</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Published</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channelData.videos.map((video) => (
            <Dialog key={video.id}>
              <DialogTrigger asChild>
                <TableRow className="cursor-pointer hover:bg-gray-100">
                  <TableCell>{video.title}</TableCell>
                  <TableCell>{formatNumber(video.viewCount)}</TableCell>
                  <TableCell>{formatNumber(video.likeCount)}</TableCell>
                  <TableCell>{video.durationFormatted}</TableCell>
                  <TableCell>{formatDate(video.publishedAt)}</TableCell>
                </TableRow>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{video.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[400px] mt-4">
                  <VideoDetails video={video} />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default YouTubeDataDisplay;
