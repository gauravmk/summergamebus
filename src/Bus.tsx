export type Bus = {
    id: string;
    lat: number;
    lon: number;
    routeNum: string;
    direction: string;
}

export type BusCoordinates = {
    outside: Bus[];
    inside: Bus[];
    both: Bus[];
}