import express from "express";
import { PrismaClient } from '@prisma/client'
import cors from 'cors';
import convertHoursToMinutes from "./utils/convert-hours-string-to-minutes";
import convertMinutesToHour from "./utils/convert-minutes-to-hour";

const app = express();
app.use(express.json());

app.use(cors())

const prisma = new PrismaClient({
  log: ['query']
});

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count: {
        select: {
          ads: true,
        }
      }
    }
  })
  const status = games.length ? 200 : 204;
  response.status(status).json(games)
});

app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const body = request.body;

  const ad = await prisma.ad.create({
    data: {
      gameId,                  
      name: body.name,
      yearsPlaying: body.yearsPlaying,
      discord: body.discord,
      weekDays: body.weekDays.join(','),
      hourStart: convertHoursToMinutes(body.hourStart),
      hourEnd: convertHoursToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    }
  })

  response.status(201).json(ad)
});

app.get('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id
  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDays: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourStart: true,
      hourEnd: true,
    },
    where: {
      gameId: gameId
    },
    orderBy: {
      createdAt: "desc"
    }
  })
  return response.json(ads.map(ad => {
    return {
      ...ad,
      weekDays: ad.weekDays.split(','),
      hourStart: convertMinutesToHour(ad.hourStart),
      hourEnd: convertMinutesToHour(ad.hourEnd)
    }
  }))
});

app.get('/ads/:id/discord', async (request, response) => {
  const adId = request.params.id;
  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId
    },
  })
  response.json({
    discord: ad?.discord,
  })
});

app.listen(3333, () => {console.log("App running at 3333 port")})