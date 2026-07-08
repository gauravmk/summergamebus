import { serve } from "bun";
import index from "./index.html";
import chunk from "lodash/chunk";
import { isArray } from "lodash";

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

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/buses": {
      async GET(req) {
        // Fetch bus coordinates
        const buses = await fetchBusCoordinates();
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

async function fetchBusCoordinates() {
  const outsideBuses = await fetchFromBusIdList(OUTSIDE_BUS_IDS);
  const insideBuses = await fetchFromBusIdList(INSIDE_BUS_IDS);
  const bothBuses = await fetchFromBusIdList(BOTH_BUS_IDS);

  return {
    outside: outsideBuses,
    inside: insideBuses,
    both: bothBuses,
  };
}

async function fetchFromBusIdList(busIds: string[]) {
  const buses = [];
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
      });
      const json = await response.json();
      let vehicles = json["bustime-response"]["vehicle"];
      if (!isArray(vehicles)) {
        vehicles = [vehicles];
      }

      buses.push(...vehicles.map((v: any) => ({
        id: v.vid,
        lat: v.lat,
        lon: v.lon,
      })));
    } catch (error) {
      console.error(`Error fetching chunk ${chunk.join(",")}: ${error}`);
    }
  }

  return buses;
}

console.log(`🚀 Server running at ${server.url}`);
