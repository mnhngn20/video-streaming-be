import {
  Controller,
  Get,
  Header,
  Param,
  Res,
  Headers,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { createReadStream, statSync } from 'fs';
import { Response } from 'express';

const VIDEOS = [
  {
    name: 'video-1.mp4',
    id: '1',
  },
  {
    name: 'video-2.mp4',
    id: '2',
  },
  {
    name: 'video-3.mp4',
    id: '3',
  },
];

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('streaming-videos')
  getVideos() {
    return [
      {
        name: 'video-1.mp4',
        id: '1',
      },
      {
        name: 'video-2.mp4',
        id: '2',
      },
      {
        name: 'video-3.mp4',
        id: '3',
      },
    ];
  }

  @Get('streaming-videos/:id')
  @Header('Accept-Ranges', 'bytes')
  @Header('Content-Type', 'application/octet-stream')
  async getVideo(
    @Param('id') id: string,
    @Headers() headers,
    @Res() res: Response,
  ) {
    const foundVideo = VIDEOS.find((video) => video.id === id);

    if (!foundVideo) throw new NotFoundException('Video Not Found');

    const videoPath = `assets/${foundVideo.name}`;
    const { size } = statSync(videoPath);
    const videoRange = headers.range;
    if (videoRange) {
      const parts = videoRange.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = end - start + 1;
      const readStreamFile = createReadStream(videoPath, {
        start,
        end,
        highWaterMark: 60,
      });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Range': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(HttpStatus.PARTIAL_CONTENT, head); //206
      readStreamFile.pipe(res);
    } else {
      const head = {
        'Content-Length': size,
      };
      res.writeHead(HttpStatus.OK, head); //200
      createReadStream(videoPath).pipe(res);
    }
  }
}
