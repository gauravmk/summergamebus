import { serve } from "bun";
import index from "./index.html";
import chunk from "lodash/chunk";
import { isArray } from "lodash";
import type { Bus, BusCoordinates } from "./Bus";

const OUTSIDE_BUS_IDS = [
  "493",
  "497",
  "507",
  "516",
  "517",
  "522",
  "527",
  "1930",
  "1931",
  "1935",
]

const INSIDE_BUS_IDS = [
  "542",
  "549",
  "557",
  "562",
  "2002",
]

const BOTH_BUS_IDS = [
  "487"
]

type Cache = {
  buses: BusCoordinates;
  lastRefreshed: Date;
}

let cache: Cache = {
  buses: {
    outside: [],
    inside: [],
    both: [],
  },
  lastRefreshed: new Date(0)
};

const server = serve({
  routes: {
    "/*": index,

    "/images/*": {
      async GET(req) {
        return new Response(Bun.file("src/images/" + req.url.split("/").pop()), {
          headers: {
            "Content-Type": "image/png",
          },
        });
      },
    },

    "/api/buses": {
      async GET(req) {
        // Fetch bus coordinates
        const buses = await getBusInfo();
        return new Response(JSON.stringify(buses), {
          headers: {
            "Content-Type": "application/json",
          },
        });
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },

  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
});

async function getBusInfo(): Promise<BusCoordinates> {
  const cacheValid = cache.lastRefreshed.getTime() > Date.now() - 3000;
  if (cacheValid) {
    return cache.buses;
  }
  return await fetchBusInfo();
}

async function fetchBusInfo(): Promise<BusCoordinates> {
  const outsideBuses = await fetchFromBusIdList(OUTSIDE_BUS_IDS);
  const insideBuses = await fetchFromBusIdList(INSIDE_BUS_IDS);
  const bothBuses = await fetchFromBusIdList(BOTH_BUS_IDS);

  if (outsideBuses != undefined) {
    cache.buses.outside = outsideBuses;
  }
  if (insideBuses != undefined) {
    cache.buses.inside = insideBuses;
  }
  if (bothBuses != undefined) {
    cache.buses.both = bothBuses;
  }
  cache.lastRefreshed = new Date();
  return cache.buses;
}

type Vehicle = {
  vid: string;
  lat: number;
  lon: number;
  rt: string;
  rtdir: string;
}

async function fetchFromBusIdList(busIds: string[]): Promise<Bus[] | undefined> {
  const buses: Bus[] = [];
  const busIdChunks = chunk(busIds, 10);
  for (const chunk of busIdChunks) {
    console.log(`Fetching chunk ${chunk.join(",")}`);
    try {
      const searchParams = new URLSearchParams({
        method: "getvehiclesbyids",
        vids: chunk.join(","),
      });
      const response = await fetch(`https://www.theride.org/api/ServiceData?${searchParams.toString()}`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      const json = await response.json();
      let vehicles = json["bustime-response"]["vehicle"] as Vehicle[];
      if (!isArray(vehicles)) {
        vehicles = [vehicles];
      }

      buses.push(...vehicles.map((v: Vehicle) => ({
        id: v.vid,
        lat: v.lat,
        lon: v.lon,
        routeNum: v.rt,
        direction: v.rtdir,
      })));
    } catch (error) {
      console.error(`Error fetching chunk ${chunk.join(",")}: ${error}`);
      return undefined;
    }
  }

  return buses;
}

console.log(`🚀 Server running at ${server.url}`);

