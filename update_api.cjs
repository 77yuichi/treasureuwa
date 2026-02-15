const fs = require('fs');
const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Update Icon Fetcher with language and correct query
content = content.replace(
  /fetch\(`\$\{XIVAPI_BASE\}\/search\?sheets=Item&query=Name~"\$\{term\}"`\)/g,
  'fetch(`${XIVAPI_BASE}/search?sheets=Item&query=${encodeURIComponent(term)}&language=en`)'
);

// 2. Update Zone Fetcher with language, debugging, and precise coordinate math
const oldZoneDataFetcher = /const fetchZoneData = async \(\) => \{[\s\S]*?fetchZoneData\(\);/;
const newZoneDataFetcher = `const fetchZoneData = async () => {
      if (xivCache.aetherytes[displayMapZone]) { 
        setDynamicAetherytes(xivCache.aetherytes[displayMapZone]); 
        setDynamicMapUrl(xivCache.maps[displayMapZone]); 
        return; 
      }
      try {
        console.log("Searching for zone:", displayMapZone);
        const res = await fetch(`\${XIVAPI_BASE}/search?sheets=TerritoryType&query=\${encodeURIComponent(displayMapZone)}&language=ja,en`);
        const data = await res.json();
        const territory = data.results?.[0];
        if (territory) {
          console.log("Found territory:", territory);
          const detailRes = await fetch(`\${XIVAPI_BASE}/sheet/TerritoryType/\${territory.row_id}?fields=Aetheryte,Map,Name`);
          const detail = await detailRes.json();
          const mapFields = detail.fields?.Map?.fields;
          const factor = mapFields?.SizeFactor || 100;
          const offX = mapFields?.OffsetX || 0;
          const offY = mapFields?.OffsetY || 0;

          const processedAeths = (detail.fields?.Aetheryte || [])
            .filter((a) => a.fields?.X !== 0)
            .map((a) => ({
              name: a.fields?.PlaceName?.fields?.Name || "傳送點",
              x: (1 + ((a.fields.X + offX) * (factor / 1000)) / 100),
              y: (1 + ((a.fields.Z + offY) * (factor / 1000)) / 100)
            }));
          
          setDynamicAetherytes(processedAeths); 
          xivCache.aetherytes[displayMapZone] = processedAeths;
          
          const mapAsset = mapFields?.Image || detail.fields?.Map?.fields?.LayerPath;
          if (mapAsset) { 
            const url = `https://v2.xivapi.com/api/asset/\${mapAsset.id || mapAsset}`; 
            setDynamicMapUrl(url); 
            xivCache.maps[displayMapZone] = url; 
          }
        }
      } catch (e) { console.error("Fetch Error:", e); }
    };
    fetchZoneData();`;

content = content.replace(oldZoneDataFetcher, newZoneDataFetcher);

fs.writeFileSync(path, content, 'utf8');
console.log('API and Coordinate Logic updated');
