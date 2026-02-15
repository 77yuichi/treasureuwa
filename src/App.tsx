import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map as MapIcon, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Copy,
  MapPin,
  Megaphone,
  ListOrdered,
  FileText,
  Loader2,
  Save
} from "lucide-react";

import { 
  WORLD_DATA, 
  GRADE_CONFIG, 
  PRESET_LOCATIONS, 
  OPTIMAL_ZONE_ORDER,
  MapGrade,
  PresetLocation,
  ZoneInfo
} from "./constants/world";

import { 
  TreasureLocation, 
  optimizeLocations 
} from "./utils/geo";

const XIVAPI_BASE = "https://v2.xivapi.com/api";

const xivCache = {
  icons: {} as Record<string, string>,
  zones: {} as Record<string, any>,
  maps: {} as Record<string, string>,
  aetherytes: {} as Record<string, any[]>,
};

const genId = () => Math.random().toString(36).substring(2, 11);

// --- 子組件 ---

const ToastContainer = ({ messages }: { messages: { id: string, text: string, type: 'success' | 'error' }[] }) => (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
      {messages.map((msg) => (
        <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`pointer-events-auto px-4 py-2 rounded shadow-lg flex items-center gap-2 text-sm font-bold min-w-[200px] justify-center text-white ${msg.type === 'success' ? 'bg-[#5297b4]' : 'bg-[#dc3545]'}`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {msg.text}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", disabled = false }: any) => {
  const variants = {
    primary: "bg-[#5297b4] hover:bg-[#68a8c4] text-white border-b-2 border-[#3e768e] active:border-b-0 active:translate-y-[2px]",
    secondary: "bg-[#555] hover:bg-[#666] text-white border-b-2 border-[#333] active:border-b-0 active:translate-y-[2px]",
    gold: "bg-[#b8a67d] hover:bg-[#c9b891] text-white border-b-2 border-[#968663] active:border-b-0 active:translate-y-[2px]",
    ghost: "bg-transparent text-gray-400 hover:text-white border-none",
  };
  return <button onClick={onClick} disabled={disabled} className={`relative px-3 py-1.5 rounded-[2px] text-sm font-bold transition-all duration-75 flex items-center justify-center gap-2 select-none outline-none ${variants[variant as keyof typeof variants]} ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>{children}</button>;
};

const MapCanvas = ({ locations, onMapClick, grade, currentZone, dynamicMapUrl, dynamicAetherytes }: any) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [imgError, setImgError] = useState(false);
  const toPercent = (coord: number) => ((coord - 1) / 41) * 100;
  const fromPercent = (pct: number) => (pct / 100) * 41 + 1;

  useEffect(() => { setImgError(false); }, [dynamicMapUrl]);

  const handleAreaClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let gameX = Math.min(42, Math.max(1, Math.round(fromPercent(((e.clientX - rect.left) / rect.width) * 100) * 10) / 10));
    let gameY = Math.min(42, Math.max(1, Math.round(fromPercent(((e.clientY - rect.top) / rect.height) * 100) * 10) / 10));
    const presets = PRESET_LOCATIONS[currentZone] || [];
    for (const p of presets) {
      const dist = Math.sqrt(Math.pow(p.x - gameX, 2) + Math.pow(p.y - gameY, 2));
      if (dist < 2.5) { gameX = p.x; gameY = p.y; break; }
    }
    onMapClick(gameX, gameY);
  };

  const sortedZoneLocations = locations.filter((l: any) => l.zone === currentZone || currentZone === "未知區域");
  const getPathPoints = () => sortedZoneLocations.map((loc: any) => `${toPercent(loc.x)},${toPercent(loc.y)}`).join(" ");

  return (
    <div ref={canvasRef} onClick={handleAreaClick} className="relative w-full h-full cursor-crosshair bg-[#111] overflow-hidden">
      {dynamicMapUrl && !imgError && (
        <img key={dynamicMapUrl} src={dynamicMapUrl} className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0" alt="背景" onError={() => setImgError(true)} />
      )}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-20" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: "10% 10%" }}></div>
      <svg className="absolute inset-0 z-20 pointer-events-none w-full h-full">
         <polyline points={getPathPoints()} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" />
         <polyline points={getPathPoints()} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeDasharray="4" />
      </svg>
      {/* 傳送點：強化視覺 */}
      {dynamicAetherytes.map((a: any, i: number) => (
        <div key={`aeth-${i}`} className="absolute z-[100] w-5 h-5 -ml-2.5 -mt-2.5 pointer-events-none" style={{ left: `${toPercent(a.x)}%`, top: `${toPercent(a.y)}%` }} title={a.name}>
          <div className="w-full h-full bg-[#5297b4] rounded-full border-2 border-white shadow-[0_0_10px_#5297b4] flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /></div>
        </div>
      ))}
      <AnimatePresence>
        {sortedZoneLocations.map((loc: any, idx: number) => (
          !loc.completed && (
            <motion.div key={loc.id} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute z-[110] -ml-3 -mt-6 pointer-events-none" style={{ left: `${toPercent(loc.x)}%`, top: `${toPercent(loc.y)}%` }}>
              <div className="relative flex items-center justify-center">
                 <MapPin className="w-8 h-8 fill-current drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-red-500" />
                 <span className="absolute -top-1 text-[10px] font-black text-white">{idx + 1}</span>
              </div>
            </motion.div>
          )
        ))}
      </AnimatePresence>
      <div className="absolute bottom-4 right-4 z-5 pointer-events-none text-white/5 text-4xl lg:text-5xl font-black rotate-[-5deg] tracking-tighter uppercase">{currentZone}</div>
    </div>
  );
};

// --- 主程式 ---

export default function App() {
  const [locations, setLocations] = useState<TreasureLocation[]>([]);
  const [activeTab, setActiveTab] = useState<"bulk" | "manual" | "route">("bulk");
  const [grade, setGrade] = useState<MapGrade>("G10"); 
  const [bulkText, setBulkText] = useState("");
  const [macroMode, setMacroMode] = useState<"party_next" | "party_list">("party_next");
  const [mapIcon, setMapIcon] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [manualMapZone, setManualMapZone] = useState<string>("未知區域");
  const [toasts, setToasts] = useState<{ id: string, text: string, type: 'success' | 'error' }[]>([]);
  const [dynamicAetherytes, setDynamicAetherytes] = useState<any[]>([]);
  const [dynamicMapUrl, setDynamicMapUrl] = useState<string | null>(null);
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  const zoneMapping = useMemo(() => {
    const map: Record<string, ZoneInfo> = {};
    Object.values(WORLD_DATA).forEach(exp => {
      Object.values(exp.regions).forEach(zones => zones.forEach(z => { map[z.name] = z; }));
    });
    return map;
  }, []);

  const addToast = (text: string, type: 'success' | 'error' = 'success') => {
    const id = genId(); setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleBulkParse = (mode: 'append' | 'replace') => {
    if (!bulkText.trim()) return addToast("請輸入內容", "error");
    const lines = bulkText.split('\n');
    const newLocs: TreasureLocation[] = [];
    const allZoneNames = Object.keys(zoneMapping);
    for (const line of lines) {
      const match = line.replace(/（/g, '(').replace(/）/g, ')').match(/[\(\[]\s*(?:X:|x:)?\s*([0-9]{1,2}\.?[0-9]*)\s*,\s*(?:Y:|y:)?\s*([0-9]{1,2}\.?[0-9]*)\s*[\)\]]/);
      if (match) {
        const nameMatch = line.match(/[\(\[]\s*([^\)\(\]]+)\s*[\)\]]/);
        const name = nameMatch ? nameMatch[1].replace(/[\uE000-\uF8FF]/g, '').trim() : "隊員";
        const zone = allZoneNames.find(z => line.includes(z)) || "未知區域";
        newLocs.push({ id: genId(), owner: name, zone, x: parseFloat(match[1]), y: parseFloat(match[2]), completed: false });
      }
    }
    if (newLocs.length > 0) {
      setLocations(mode === 'replace' ? newLocs : [...locations, ...newLocs]);
      setActiveTab("route"); addToast(`已登錄 ${newLocs.length} 個點`);
    } else addToast("未偵測到座標", "error");
  };

  useEffect(() => {
    const savedLocs = localStorage.getItem("ff14_treasure_locations");
    const savedGrade = localStorage.getItem("ff14_treasure_grade");
    if (savedLocs) setLocations(JSON.parse(savedLocs));
    if (savedGrade) setGrade(savedGrade as MapGrade);
  }, []);

  useEffect(() => {
    localStorage.setItem("ff14_treasure_locations", JSON.stringify(locations));
    localStorage.setItem("ff14_treasure_grade", grade);
  }, [locations, grade]);

  useEffect(() => {
    const fetchIcon = async () => {
      const term = { "G8": "龍革藏寶圖", "G10": "瞪羚革藏寶圖", "G12": "游龍革藏寶圖", "G14/G15": "巨蜥革藏寶圖", "G17/G18": "恐鳥革藏寶圖" }[grade];
      try {
        const res = await fetch(`${XIVAPI_BASE}/search?sheets=Item&query=Name="${term}"&language=ja&fields=Icon`);
        const data = await res.json();
        const iconId = data.results?.[0]?.fields?.Icon?.id || data.results?.[0]?.fields?.Icon;
        if (iconId) setMapIcon(`${XIVAPI_BASE}/asset/${iconId}?format=png`);
      } catch (e) {}
    };
    fetchIcon();
  }, [grade]);

  const displayMapZone = useMemo(() => {
    if (activeTab === "manual") return manualMapZone;
    const grouped = optimizeLocations(locations, OPTIMAL_ZONE_ORDER, xivCache.aetherytes);
    const firstActive = grouped.sorted.find(l => !l.completed);
    return firstActive ? firstActive.zone : (grouped.sorted[0]?.zone || "未知區域");
  }, [activeTab, manualMapZone, locations]);

  // 抓取地圖與乙太之光 (最強相容性方案)
  useEffect(() => {
    if (displayMapZone === "未知區域") { setDynamicAetherytes([]); setDynamicMapUrl(null); return; }
    const fetchZoneData = async () => {
      if (xivCache.maps[displayMapZone]) {
        setDynamicMapUrl(xivCache.maps[displayMapZone]);
        setDynamicAetherytes(xivCache.aetherytes[displayMapZone] || []);
        return;
      }
      setIsLoadingMap(true);
      const zoneEn = zoneMapping[displayMapZone]?.en;
      try {
        // 1. 搜尋地圖獲取基本校正值
        const searchRes = await fetch(`${XIVAPI_BASE}/search?sheets=Map&query=PlaceName.Name="${zoneEn}"&language=en&fields=Id,SizeFactor,OffsetX,OffsetY`);
        const searchData = await searchRes.json();
        const mapResult = searchData.results?.[0];
        if (mapResult) {
          const mapData = mapResult.fields;
          const [code, idx] = mapData.Id.split('/');
          setDynamicMapUrl(`${XIVAPI_BASE}/asset/map/${code}/${idx}?version=latest`);
          xivCache.maps[displayMapZone] = `${XIVAPI_BASE}/asset/map/${code}/${idx}?version=latest`;

          // 2. 直接讀取區域資料表 (TerritoryType)
          const terrSearch = await fetch(`${XIVAPI_BASE}/search?sheets=TerritoryType&query=Map=${mapResult.row_id}`);
          const terrSearchData = await terrSearch.json();
          const territoryId = terrSearchData.results?.[0]?.row_id;

          if (territoryId) {
            // 3. 抓取該區域所有的 Aetheryte
            const detailRes = await fetch(`${XIVAPI_BASE}/sheet/TerritoryType/${territoryId}?fields=Aetheryte`);
            const detail = await detailRes.json();
            
            // 重要：針對 v2 的 Aetheryte 可能只是個 ID 的情況，我們必須直接搜尋 Aetheryte 資料表
            // 修改：使用 Territory 欄位進行查詢，並包含多種座標欄位以提高相容性
            const aethSearch = await fetch(`${XIVAPI_BASE}/search?sheets=Aetheryte&query=Territory=${territoryId}&fields=PlaceName.Name,X,Z,Y,PosX,PosZ,PosY`);
            const aethData = await aethSearch.json();
            
            const factor = mapData.SizeFactor || 100;
            const offX = mapData.OffsetX || 0;
            const offY = mapData.OffsetY || 0;

            let aethResults = aethData.results || [];
            // 如果搜尋沒結果但 detail 有資料，則使用 detail 的資料
            if (aethResults.length === 0 && detail.fields?.Aetheryte?.fields) {
              aethResults = [{ fields: detail.fields.Aetheryte.fields }];
            }

            const processedAeths = aethResults.map((item: any) => {
              const f = item.fields;
              if (!f) return null;
              // 兼容多種可能的位置欄位名稱
              const rawX = f.X ?? f.PosX;
              const rawZ = f.Z ?? f.PosZ ?? f.Y ?? f.PosY;
              
              if (rawX === undefined || rawZ === undefined) return null;
              return {
                name: f.PlaceName?.Name || "傳送點",
                x: (1 + ((rawX + offX) * (factor / 1000)) / 100),
                y: (1 + ((rawZ + offY) * (factor / 1000)) / 100)
              };
            }).filter((a: any) => a !== null && a.x > 1.1);

            setDynamicAetherytes(processedAeths);
            xivCache.aetherytes[displayMapZone] = processedAeths;
          }
        }
      } catch (e) { console.error("同步失敗", e); }
      finally { setIsLoadingMap(false); }
    };
    fetchZoneData();
  }, [displayMapZone, zoneMapping]);

  const groupedLocations = useMemo(() => optimizeLocations(locations, OPTIMAL_ZONE_ORDER, xivCache.aetherytes), [locations]);
  const macroText = useMemo(() => {
    const active = groupedLocations.sorted.filter(l => !l.completed);
    if (active.length === 0) return locations.length > 0 ? "全部完成！" : "";
    if (macroMode === "party_next") return `/p 【下一站】 ${active[0].zone} ( X:${active[0].x} Y:${active[0].y} ) 圖主：${active[0].owner}\n/p  <flag>`;
    return `/p 【待挖清單】\n` + active.map((l, i) => `/p ${i+1}. ${l.zone} - ${l.owner} (X:${l.x} Y:${l.y})`).join("\n");
  }, [groupedLocations, macroMode, locations]);

  const manualInputsInit = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ id: `manual-${i}`, owner: "", zone: "未知區域", x: 0, y: 0, completed: false })), []);
  const [manualInputs, setManualInputs] = useState<TreasureLocation[]>(manualInputsInit);

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] font-sans selection:bg-[#5297b4] selection:text-white">
      <ToastContainer messages={toasts} />
      <MapSelectionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={(zone: any, x: any, y: any) => {
        if (editingTargetId) {
          setManualInputs(prev => prev.map(item => item.id === editingTargetId ? { ...item, x, y, zone } : item));
          setManualMapZone(zone); setIsModalOpen(false);
        }
      }} grade={grade} initialZone={manualMapZone} zoneMapping={zoneMapping} />

      <div className="max-w-[1200px] mx-auto p-4 flex flex-col gap-6">
        <header className="flex items-center justify-between border-b border-gray-800 pb-4">
          <div><h1 className="text-3xl font-black text-white tracking-tighter italic uppercase underline decoration-[#5297b4]">FF14 藏寶助手</h1><p className="text-[10px] text-[#5297b4] font-bold uppercase tracking-widest flex items-center gap-2">官方數據同步模式 <Save className="w-2.5 h-2.5 animate-pulse" title="自動儲存中"/></p></div>
          <Button variant="secondary" onClick={() => { setLocations([]); localStorage.removeItem("ff14_treasure_locations"); addToast("重置完成"); }}>重置資料</Button>
        </header>

        <nav className="flex bg-[#2d2d2d] rounded-sm overflow-hidden border border-gray-700 shadow-xl">
          {Object.keys(WORLD_DATA).map((g) => (
            <button key={g} onClick={() => { setGrade(g as any); setLocations([]); }} className={`flex-1 py-3 text-xs font-black transition-all ${grade === g ? "bg-[#5297b4] text-white shadow-inner" : "bg-[#e0e0e0] text-black hover:bg-white"}`}>{g}</button>
          ))}
        </nav>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 flex flex-col border border-gray-800 rounded-sm overflow-hidden bg-[#2d2d2d] shadow-2xl">
            <div className="grid grid-cols-3 bg-black">
              {[{id:"bulk",l:"自動輸入"}, {id:"manual",l:"手動標記"}, {id:"route",l:"最佳路徑"}].map((t) => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`py-4 text-xs font-black uppercase transition-all ${activeTab === t.id ? "bg-[#5297b4] text-white" : "text-gray-500 hover:text-gray-300"}`}>{t.l}</button>
              ))}
            </div>
            <div className="min-h-[520px] relative">
              <AnimatePresence mode="wait">
                {activeTab === "bulk" && (
                  <motion.div key="bulk" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 flex flex-col gap-4">
                    <textarea value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="在此貼上遊戲聊天記錄..." className="w-full h-80 bg-[#111] text-[#5297b4] p-4 font-mono text-xs resize-none border border-gray-800 focus:border-[#5297b4] outline-none rounded-sm shadow-inner" />
                    <div className="flex gap-4">
                      <Button onClick={() => handleBulkParse('append')} className="flex-1 py-4 font-bold">加入</Button>
                      <Button onClick={() => handleBulkParse('replace')} variant="secondary" className="flex-1 py-4 font-bold">覆蓋</Button>
                    </div>
                  </motion.div>
                )}
                {activeTab === "manual" && (
                  <motion.div key="manual" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 flex flex-col gap-2">
                    {manualInputs.map((input) => (
                      <div key={input.id} className="flex h-12 border border-gray-800 bg-[#1a1a1a] rounded-sm group overflow-hidden">
                        <input type="text" placeholder="名" value={input.owner} onChange={(e) => setManualInputs(prev => prev.map(p => p.id === input.id ? {...p, owner: e.target.value} : p))} className="w-20 bg-transparent text-xs px-3 border-r border-gray-800 outline-none focus:bg-[#222]" />
                        <button onClick={() => { setEditingTargetId(input.id); setIsModalOpen(true); }} className="flex-1 text-[10px] font-bold uppercase hover:text-[#5297b4] transition-colors text-center">{input.x > 0 ? `${input.zone} (${input.x}, ${input.y})` : "設定座標點"}</button>
                      </div>
                    ))}
                    <Button onClick={() => { const valid = manualInputs.filter(i => i.x > 0); setLocations([...locations, ...valid.map(v => ({...v, id: genId()}))]); setActiveTab("route"); addToast("標記完成"); }} className="mt-4 py-4 font-bold uppercase">確認輸入</Button>
                  </motion.div>
                )}
                {activeTab === "route" && (
                  <motion.div key="route" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto max-h-[420px] custom-scrollbar">
                      {groupedLocations.zoneOrder.map(z => (
                        <div key={z} className="mb-2">
                          <div className="bg-[#1a1a1a] text-[10px] font-black p-2 px-4 text-[#5297b4] border-y border-gray-800 uppercase flex items-center gap-2">{z}</div>
                          {groupedLocations.groups[z].map(loc => (
                            <div key={loc.id} onClick={() => setLocations(prev => prev.map(l => l.id === loc.id ? {...l, completed: !l.completed} : l))} className={`p-3 border-b border-gray-800 flex justify-between items-center cursor-pointer transition-all ${loc.completed ? "opacity-20 grayscale scale-95" : "bg-[#2d2d2d] hover:bg-[#333]"}`}>
                              <div className="flex flex-col"><span className="text-xs font-bold text-white uppercase">{loc.owner}</span><span className="text-[9px] font-mono text-gray-500">X:{loc.x} Y:{loc.y}</span></div>
                              <Trash2 className="w-4 h-4 text-gray-600 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setLocations(prev => prev.filter(l => l.id !== loc.id)); }} />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#111] p-4 border-t border-gray-800 mt-auto">
                      <div className="flex gap-2 mb-3">
                        {[{id:"party_next",l:"單點廣播"}, {id:"party_list",l:"全隊清單"}].map(m => <button key={m.id} onClick={() => setMacroMode(m.id as any)} className={`flex-1 py-2 text-[9px] font-black rounded-sm border transition-all ${macroMode === m.id ? "bg-[#5297b4] border-[#5297b4] text-white" : "border-gray-800 text-gray-600 hover:border-gray-600"}`}>{m.l}</button>)}
                      </div>
                      <textarea readOnly value={macroText} onClick={() => { if(macroText) { navigator.clipboard.writeText(macroText); addToast("已複製巨集"); } }} className="w-full h-20 bg-[#0a0a0a] text-[10px] text-[#5297b4] font-mono resize-none cursor-pointer p-3 rounded-sm border border-gray-900 outline-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <section className="lg:col-span-7 flex flex-col gap-4">
            <div className="border-4 border-[#b8a67d] bg-[#111] relative aspect-square shadow-2xl rounded-sm overflow-hidden">
              <AnimatePresence>
                {isLoadingMap && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-[#5297b4] animate-spin" />
                    <span className="text-[10px] font-black text-[#5297b4] tracking-[0.2em] uppercase text-center">同步數據中...</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <MapCanvas locations={activeTab === 'manual' ? manualInputs : groupedLocations.sorted} onMapClick={() => {}} grade={grade} currentZone={displayMapZone} dynamicMapUrl={dynamicMapUrl} dynamicAetherytes={dynamicAetherytes} />
            </div>
            <div className="flex justify-between items-center bg-[#1a1a1a] p-3 rounded-sm border border-gray-800 shadow-inner">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#5297b4] rounded-full border-2 border-white shadow-[0_0_8px_#5297b4]" /><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">乙太之光</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" /><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">目標標記</span></div>
              </div>
              <span className="text-[10px] font-black text-[#5297b4] uppercase tracking-widest">{displayMapZone}</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

const MapSelectionModal = ({ isOpen, onClose, onConfirm, grade, initialZone, zoneMapping }: any) => {
  const [selectedZone, setSelectedZone] = useState(initialZone);
  const [dynamicMapUrl, setDynamicMapUrl] = useState<string | null>(null);
  useEffect(() => { if (isOpen) setSelectedZone(initialZone); }, [isOpen, initialZone]);
  useEffect(() => {
    if (!isOpen || selectedZone === "未知區域") return;
    const fetchZone = async () => {
      const zoneEn = zoneMapping[selectedZone]?.en;
      if (!zoneEn) return;
      try {
        const q = encodeURIComponent(`PlaceName.Name="${zoneEn}"`);
        const res = await fetch(`${XIVAPI_BASE}/search?sheets=Map&query=${q}&language=en&fields=Id`);
        const data = await res.json();
        const mapResult = data.results?.[0];
        if (mapResult?.fields?.Id) {
          const [code, idx] = mapResult.fields.Id.split('/');
          setDynamicMapUrl(`${XIVAPI_BASE}/asset/map/${code}/${idx}?version=latest`);
        }
      } catch (e) {}
    };
    fetchZone();
  }, [selectedZone, isOpen, zoneMapping]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#1a1a1a] border border-gray-800 rounded-sm shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black">
          <span className="font-black text-white text-xs flex items-center gap-2 tracking-widest uppercase"><MapIcon className="w-4 h-4 text-[#5297b4]" /> 設定位置</span>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6 bg-[#1a1a1a]">
          <select value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} className="w-full bg-black border border-gray-800 text-[#5297b4] text-xs font-bold p-3 rounded-sm outline-none focus:border-[#5297b4]">
            <option value="未知區域">請選擇區域...</option>
            {Object.values(WORLD_DATA[grade as MapGrade].regions).flat().map(z => <option key={z.name} value={z.name}>{z.name}</option>)}
          </select>
          <div className="aspect-square w-full max-w-[400px] mx-auto border border-gray-800 relative bg-[#111]">
             <MapCanvas locations={[]} onMapClick={(x: any, y: any) => onConfirm(selectedZone, x, y)} grade={grade} currentZone={selectedZone} dynamicMapUrl={dynamicMapUrl} dynamicAetherytes={[]} />
          </div>
        </div>
        <div className="p-4 border-t border-gray-800 bg-black flex justify-end"><Button variant="secondary" onClick={onClose}>取消</Button></div>
      </motion.div>
    </div>
  );
};
