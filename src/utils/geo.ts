export interface TreasureLocation {
  id: string;
  owner: string;
  zone: string;
  x: number;
  y: number;
  completed: boolean;
}

/**
 * Converts Game Coordinates to 1-42 Scale used in FF14 Maps
 */
export const convertToGameCoord = (val: number, sizeFactor: number, offset: number) => {
  return ((val + offset) * (sizeFactor / 100) + 100) / 100;
};

export const getDistance = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/**
 * Greedy Nearest Neighbor algorithm for route optimization
 */
export const optimizeLocations = (
  locations: TreasureLocation[],
  zoneOrder: string[],
  dynamicAetherytesCache: Record<string, {x: number, y: number, name: string}[]>
) => {
  const groups: Record<string, TreasureLocation[]> = {};
  locations.forEach(loc => {
    if (!groups[loc.zone]) groups[loc.zone] = [];
    groups[loc.zone].push(loc);
  });

  const sortedZones = Object.keys(groups).sort((a, b) => {
    const idxA = zoneOrder.indexOf(a);
    const idxB = zoneOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const optimizedGroups: Record<string, TreasureLocation[]> = {};
  let flattened: TreasureLocation[] = [];

  sortedZones.forEach(zone => {
    let points = [...groups[zone]];
    const zoneAetherytes = dynamicAetherytesCache[zone] || []; 
    
    if (zoneAetherytes.length === 0) {
      points.sort((a, b) => a.y - b.y);
      optimizedGroups[zone] = points;
      flattened = [...flattened, ...points];
      return;
    }

    const sortedPoints: TreasureLocation[] = [];
    let bestStartIdx = -1;
    let minStartDist = Infinity;

    points.forEach((p, idx) => {
      let distToEth = Infinity;
      for (const eth of zoneAetherytes) {
         const d = Math.hypot(p.x - eth.x, p.y - eth.y);
         if (d < distToEth) distToEth = d;
      }
      if (distToEth < minStartDist) {
        minStartDist = distToEth;
        bestStartIdx = idx;
      }
    });

    if (bestStartIdx !== -1) {
      let current = points[bestStartIdx];
      sortedPoints.push(current);
      points.splice(bestStartIdx, 1);

      while (points.length > 0) {
        let nextIdx = -1;
        let minNextDist = Infinity;
        points.forEach((p, idx) => {
          const d = Math.hypot(current.x - p.x, current.y - p.y);
          if (d < minNextDist) {
            minNextDist = d;
            nextIdx = idx;
          }
        });
        if (nextIdx !== -1) {
          current = points[nextIdx];
          sortedPoints.push(current);
          points.splice(nextIdx, 1);
        } else break;
      }
    } else {
       sortedPoints.push(...points);
    }

    optimizedGroups[zone] = sortedPoints;
    flattened = [...flattened, ...sortedPoints];
  });

  return { sorted: flattened, groups: optimizedGroups, zoneOrder: sortedZones };
};
