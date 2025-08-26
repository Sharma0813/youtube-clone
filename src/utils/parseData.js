import axios from "axios";
import { parseVideoDuration } from "./parseVideoDuration";
import { convertRawtoString } from "./convertRawtoString";
import { timeSince } from "./timeSince";

const API_KEY = process.env.REACT_APP_YOUTUBE_DATA_API_KEY;

export const parseData = async (items) => {
  try {
    const videoIds = [];
    const channelIds = [];

    items.forEach((item) => {
      if (item.id.videoId && item.snippet) {
        videoIds.push(item.id.videoId);
        channelIds.push(item.snippet.channelId);
      }
    });

    // Fetch channel data
    const {
      data: { items: channelsData },
    } = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/channels?part=snippet&id=${channelIds.join(
        ","
      )}&key=${API_KEY}`
    );

    const parsedChannelsData = channelsData.map((channel) => ({
      id: channel.id,
      image: channel.snippet.thumbnails.default.url,
    }));

    // Fetch video details
    const {
      data: { items: videosData },
    } = await axios.get(
      `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(
        ","
      )}&key=${API_KEY}`
    );

    const parsedData = items.map((item) => {
      const videoId = item.id.videoId;
      const channelId = item.snippet.channelId;

      const channelData = parsedChannelsData.find(
        (data) => data.id === channelId
      );
      const videoData = videosData.find((video) => video.id === videoId);

      if (!channelData || !videoData) return null;

      return {
        videoId,
        videoTitle: item.snippet.title,
        videoDescription: item.snippet.description,
        videoThumbnail: item.snippet.thumbnails.medium.url,
        videoLink: `https://www.youtube.com/watch?v=${videoId}`,
        videoDuration: parseVideoDuration(videoData.contentDetails?.duration),
        videoViews: convertRawtoString(videoData.statistics?.viewCount),
        videoAge: timeSince(new Date(item.snippet.publishedAt)),
        channelInfo: {
          id: channelId,
          image: channelData.image,
          name: item.snippet.channelTitle,
        },
      };
    });

    return parsedData.filter(Boolean); // remove any null entries
  } catch (err) {
    console.error("Error in parseData:", err);
    return [];
  }
};
