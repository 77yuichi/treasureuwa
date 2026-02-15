export type MapGrade = "G8" | "G10" | "G12" | "G14/G15" | "G17/G18";

export interface ZoneInfo {
  name: string;
  en: string;
}

export interface WorldData {
  expansion: string;
  regions: Record<string, ZoneInfo[]>;
}

export const WORLD_DATA: Record<MapGrade, WorldData> = {
  "G8": {
    expansion: "Heavensward",
    regions: {
      "庫爾札斯": [{ name: "庫爾札斯西部高地", en: "Coerthas Western Highlands" }],
      "阿巴拉提亞": [
        { name: "阿巴拉提亞雲海", en: "The Sea of Clouds" },
        { name: "魔大陸阿濟茲拉", en: "Azys Lla" }
      ],
      "得拉瓦尼亞": [
        { name: "高地得拉瓦尼亞", en: "The Dravanian Forelands" },
        { name: "低地得拉瓦尼亞", en: "The Dravanian Hinterlands" },
        { name: "翻雲霧海", en: "The Churning Mists" }
      ],
    }
  },
  "G10": {
    expansion: "Stormblood",
    regions: {
      "基拉巴尼亞": [
        { name: "基拉巴尼亞邊區", en: "The Fringes" },
        { name: "基拉巴尼亞山區", en: "The Peaks" },
        { name: "基拉巴尼亞湖區", en: "The Lochs" }
      ],
      "奧薩德": [
        { name: "紅玉海", en: "The Ruby Sea" },
        { name: "延夏", en: "Yanxia" },
        { name: "太陽神草原", en: "The Azim Steppe" }
      ],
    }
  },
  "G12": {
    expansion: "Shadowbringers",
    regions: {
      "諾弗蘭特": [
        { name: "雷克蘭德", en: "Lakeland" },
        { name: "柯魯西亞島", en: "Kholusia" },
        { name: "安穆·艾蘭", en: "Amh Araeng" },
        { name: "伊爾·美格", en: "Il Mheg" },
        { name: "拉凱提卡大森林", en: "The Rak'tika Greatwood" },
        { name: "黑風海", en: "The Tempest" }
      ],
    }
  },
  "G14/G15": {
    expansion: "Endwalker",
    regions: {
      "北洋地域": [
        { name: "迷津", en: "Labyrinthos" },
        { name: "薩維奈島", en: "Thavnair" },
        { name: "加雷馬德", en: "Garlemald" }
      ],
      "伊爾薩巴德": [
        { name: "嘆息海", en: "Mare Lamentorum" },
        { name: "厄爾庇斯", en: "Elpis" },
        { name: "究極神兵", en: "Ultima Thule" }
      ],
    }
  },
  "G17/G18": {
    expansion: "Dawntrail",
    regions: {
      "約克·圖拉爾": [
        { name: "奧爾考帕查", en: "Urqopacha" },
        { name: "可扎瑪烏卡", en: "Kozama'uka" }
      ],
      "夏克·圖拉爾": [
        { name: "亞克特爾樹海", en: "Yak T'el" },
        { name: "夏勞尼荒野", en: "Shaaloani" }
      ],
      "亞歷山德里亞": [
        { name: "遺產之地", en: "Heritage Found" },
        { name: "活著的記憶", en: "Living Memory" }
      ],
    }
  },
};

export const GRADE_CONFIG: Record<MapGrade, { color: string }> = {
  "G8": { color: "bg-blue-900/10" },
  "G10": { color: "bg-red-900/10" },
  "G12": { color: "bg-purple-900/10" },
  "G14/G15": { color: "bg-indigo-900/10" },
  "G17/G18": { color: "bg-amber-900/10" },
};

export interface PresetLocation {
  label: string;
  x: number;
  y: number;
}

export const PRESET_LOCATIONS: Record<string, PresetLocation[]> = {
  "基拉巴尼亞邊區": [
    { label: "1", x: 11.7, y: 17.3 }, { label: "2", x: 10.0, y: 26.5 }, { label: "3", x: 14.8, y: 23.3 }, { label: "4", x: 20.5, y: 30.5 },
    { label: "5", x: 25.0, y: 11.0 }, { label: "6", x: 27.9, y: 21.6 }, { label: "7", x: 31.1, y: 20.7 }, { label: "8", x: 28.8, y: 29.5 }
  ],
  "基拉巴尼亞山區": [
    { label: "1", x: 11.7, y: 11.3 }, { label: "2", x: 10.5, y: 20.5 }, { label: "3", x: 15.9, y: 14.6 }, { label: "4", x: 22.3, y: 6.4 },
    { label: "5", x: 25.6, y: 11.6 }, { label: "6", x: 28.2, y: 17.6 }, { label: "7", x: 26.2, y: 29.3 }, { label: "8", x: 12.7, y: 24.3 }
  ],
  "基拉巴尼亞湖區": [
    { label: "1", x: 25.0, y: 8.0 }, { label: "2", x: 13.8, y: 22.1 }, { label: "3", x: 19.5, y: 23.4 }, { label: "4", x: 22.5, y: 25.0 },
    { label: "5", x: 31.9, y: 6.5 }, { label: "6", x: 26.0, y: 32.6 }, { label: "7", x: 33.7, y: 22.0 }, { label: "8", x: 33.7, y: 10.6 }
  ],
  "紅玉海": [
    { label: "1", x: 5.9, y: 16.2 }, { label: "2", x: 12.5, y: 28.5 }, { label: "3", x: 19.1, y: 9.1 }, { label: "4", x: 18.0, y: 36.0 },
    { label: "5", x: 27.1, y: 29.5 }, { label: "6", x: 32.6, y: 23.5 }, { label: "7", x: 32.1, y: 9.1 }, { label: "8", x: 34.1, y: 16.6 }
  ],
  "延夏": [
    { label: "1", x: 29.1, y: 7.6 }, { label: "2", x: 36.1, y: 15.5 }, { label: "3", x: 32.7, y: 24.8 }, { label: "4", x: 23.7, y: 23.2 },
    { label: "5", x: 13.5, y: 22.8 }, { label: "6", x: 16.5, y: 12.8 }, { label: "7", x: 22.2, y: 11.1 }, { label: "8", x: 18.5, y: 29.8 }
  ],
  "太陽神草原": [
    { label: "1", x: 29.4, y: 11.9 }, { label: "2", x: 35.7, y: 16.8 }, { label: "3", x: 35.5, y: 27.2 }, { label: "4", x: 25.0, y: 32.7 },
    { label: "5", x: 17.8, y: 32.2 }, { label: "6", x: 10.4, y: 15.9 }, { label: "7", x: 14.6, y: 21.3 }, { label: "8", x: 22.2, y: 23.5 }
  ],
};

export const OPTIMAL_ZONE_ORDER: string[] = [
  "基拉巴尼亞邊區", "基拉巴尼亞山區", "基拉巴尼亞湖區", "紅玉海", "延夏", "太陽神草原",
  "庫爾札斯西部高地", "阿巴拉提亞雲海", "魔大陸阿濟茲拉", "高地得拉瓦尼亞", "翻雲霧海", "低地得拉瓦尼亞",
  "迷津", "薩維奈島", "加雷馬德", "嘆息海", "厄爾庇斯", "究極神兵",
  "奧爾考帕查", "可扎瑪烏卡", "亞克特爾樹海", "夏勞尼荒野", "遺產之地", "活著的記憶"
];
