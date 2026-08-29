/* ============================================================
 * config.js — 城市配置 & API 常量
 * 新增城市：往 CITIES 里加一条即可（flag 用国旗 emoji）
 * ============================================================ */

const WEATHER_API_BASE = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_API_BASE = "https://geocoding-api.open-meteo.com/v1/search";
/* Wikipedia REST API：取城市条目主图作为背景（免密钥、免费、允许热链） */
const WIKI_API_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";

/* 预置城市名（query 英文名）→ Wikipedia 条目名
 * HK/SG 主条目主图是国旗 SVG，改用地标条目取实景照片 */
const WIKI_TITLES = {
  "Beijing": "Beijing", "Shanghai": "Shanghai", "Hong Kong": "Kowloon",
  "Taipei": "Taipei", "Tokyo": "Tokyo", "Seoul": "Seoul",
  "Singapore": "Marina_Bay,_Singapore", "Bangkok": "Bangkok", "London": "London",
  "Paris": "Paris", "Berlin": "Berlin", "New York": "New York City",
  "San Francisco": "San Francisco", "Sydney": "Sydney",
  "Moscow": "Moscow", "Dubai": "Dubai",
};

/* ===== 中文城市名 → 英文官方名 词典 =====
 * Open-Meteo 中文数据严重残缺（渥太华只有机场、华沙/胡志明市整条缺失），
 * 且 API 内部按 GeoNames 英文名索引——中文完整名直接映射英文名是最可靠路径。
 * 每条均已实测：en 名可命中 API、Wikipedia 有主图（Queenstown 用消歧义页）。
 * key 为用户会输入的中文（含繁体常见写法），value 为英文官方名。 */
const CITY_ZH_EN = {
  // 中国
  "北京": "Beijing", "上海": "Shanghai", "广州": "Guangzhou", "深圳": "Shenzhen",
  "成都": "Chengdu", "重庆": "Chongqing", "杭州": "Hangzhou", "西安": "Xi'an",
  "南京": "Nanjing", "武汉": "Wuhan", "天津": "Tianjin", "苏州": "Suzhou",
  "青岛": "Qingdao", "厦门": "Xiamen", "昆明": "Kunming", "三亚": "Sanya",
  "哈尔滨": "Harbin", "大连": "Dalian", "长沙": "Changsha", "郑州": "Zhengzhou",
  "香港": "Hong Kong", "台北": "Taipei", "高雄": "Kaohsiung", "澳门": "Macau",
  // 日韩东南亚
  "东京": "Tokyo", "東京": "Tokyo", "大阪": "Osaka", "大阪府": "Osaka",
  "京都": "Kyoto", "名古屋": "Nagoya", "名古屋市": "Nagoya", "札幌": "Sapporo",
  "札幌市": "Sapporo", "福冈": "Fukuoka", "福冈市": "Fukuoka",
  "横滨": "Yokohama", "神户": "Kobe", "冲绳": "Okinawa Island",
  "首尔": "Seoul", "首爾": "Seoul", "釜山": "Busan", "釜山市": "Busan",
  "济州": "Jeju City",
  "新加坡": "Singapore", "曼谷": "Bangkok", "清迈": "Chiang Mai", "清邁": "Chiang Mai",
  "普吉岛": "Phuket", "普吉": "Phuket", "芭提雅": "Pattaya",
  "胡志明市": "Ho Chi Minh City", "胡志明": "Ho Chi Minh City", "西贡": "Ho Chi Minh City",
  "河内": "Hanoi", "河內": "Hanoi", "岘港": "Da Nang", "雅加达": "Jakarta",
  "雅加達": "Jakarta", "苏拉巴亚": "Surabaya", "泗水": "Surabaya",
  "金边": "Phnom Penh", "金邊": "Phnom Penh", "万象": "Vientiane",
  "琅勃拉邦": "Luang Prabang",
  "巴厘岛": "Bali", "峇里島": "Bali", "万隆": "Bandung", "吉隆坡": "Kuala Lumpur",
  "槟城": "Penang", "檳城": "Penang", "马尼拉": "Manila", "仰光": "Yangon",
  // 南亚中东
  "孟买": "Mumbai", "新德里": "New Delhi", "德里": "Delhi", "班加罗尔": "Bengaluru",
  "金奈": "Chennai", "加尔各答": "Kolkata", "加德满都": "Kathmandu",
  "拉合尔": "Lahore", "卡拉奇": "Karachi", "达卡": "Dhaka",
  "科伦坡": "Colombo", "马累": "Malé",
  "迪拜": "Dubai", "阿布扎比": "Abu Dhabi", "多哈": "Doha", "利雅得": "Riyadh",
  "伊斯坦布尔": "Istanbul", "伊斯坦堡": "Istanbul", "安塔利亚": "Antalya",
  "安曼": "Amman", "特拉维夫": "Tel Aviv", "耶路撒冷": "Jerusalem",
  // 欧洲
  "伦敦": "London", "倫敦": "London", "巴黎": "Paris", "柏林": "Berlin",
  "慕尼黑": "Munich", "法兰克福": "Frankfurt", "罗马": "Rome", "羅馬": "Rome",
  "米兰": "Milan", "米蘭": "Milan", "威尼斯": "Venice", "佛羅倫薩": "Florence",
  "佛罗伦萨": "Florence", "那不勒斯": "Naples", "巴勒莫": "Palermo", "巴勒莫市": "Palermo",
  "热那亚": "Genoa", "熱那亞": "Genoa", "都灵": "Turin", "都靈": "Turin",
  "博洛尼亚": "Bologna", "波隆那": "Bologna", "卡塔尼亚": "Catania",
  "墨西拿": "Messina", "卡利亚里": "Cagliari", "巴塞罗那": "Barcelona",
  "巴塞隆拿": "Barcelona", "馬德里": "Madrid", "马德里": "Madrid",
  "瓦伦西亚": "Valencia", "瓦倫西亞": "Valencia", "毕尔巴鄂": "Bilbao",
  "薩拉曼卡": "Salamanca", "萨拉曼卡": "Salamanca", "科尔多瓦": "Córdoba",
  "格拉纳达": "Granada", "馬拉加": "Malaga", "马拉加": "Malaga",
  "塞维利亚": "Seville", "里斯本": "Lisbon", "波尔图": "Porto",
  "斯特拉斯堡": "Strasbourg", "波尔多": "Bordeaux", "波爾多": "Bordeaux",
  "图卢兹": "Toulouse", "圖盧茲": "Toulouse", "纽伦堡": "Nuremberg", "紐倫堡": "Nuremberg",
  "斯图加特": "Stuttgart", "科隆": "Cologne", "德累斯顿": "Dresden",
  "阿姆斯特丹": "Amsterdam", "布鲁塞尔": "Brussels", "布魯塞爾": "Brussels",
  "苏黎世": "Zurich", "日内瓦": "Geneva", "維也納": "Vienna", "维也纳": "Vienna",
  "布拉格": "Prague", "华沙": "Warsaw", "華沙": "Warsaw", "克拉科夫": "Krakow",
  "布达佩斯": "Budapest", "布達佩斯": "Budapest", "布加勒斯特": "Bucharest",
  "雅典": "Athens", "都柏林": "Dublin", "爱丁堡": "Edinburgh",
  "愛丁堡": "Edinburgh", "曼彻斯特": "Manchester", "曼徹斯特": "Manchester",
  "哥本哈根": "Copenhagen", "斯德哥尔摩": "Stockholm", "奧斯陸": "Oslo", "奥斯陆": "Oslo",
  "赫尔辛基": "Helsinki", "雷克雅未克": "Reykjavik", "莫斯科": "Moscow",
  "圣彼得堡": "Saint Petersburg", "聖彼得堡": "Saint Petersburg", "基辅": "Kyiv",
  // 东欧/北欧/中亚
  "里加": "Riga", "維爾紐斯": "Vilnius", "维尔纽斯": "Vilnius",
  "明斯克": "Minsk", "明斯克 ": "Minsk",
  "塔林": "Tallinn", "巴库": "Baku", "巴庫": "Baku", "第比利斯": "Tbilisi",
  "埃里温": "Yerevan", "塔什干": "Tashkent", "阿拉木图": "Almaty", "阿拉木圖": "Almaty",
  "萨格勒布": "Zagreb", "貝爾格萊德": "Belgrade", "贝尔格莱德": "Belgrade",
  "索菲亚": "Sofia", "索菲亞": "Sofia", "格但斯克": "Gdansk", "马尔默": "Malmo",
  "哥德堡": "Gothenburg", "奥胡斯": "Aarhus", "尼斯": "Nice", "马赛": "Marseille",
  "馬賽": "Marseille", "里昂": "Lyon", "汉堡": "Hamburg", "漢堡": "Hamburg",
  // 北美
  "纽约": "New York", "紐約": "New York", "纽约市": "New York", "紐約市": "New York",
  "纽约州": "New York", "紐約州": "New York", "华盛顿": "Washington D.C.",
  "華盛頓": "Washington D.C.", "波士顿": "Boston", "波士頓": "Boston",
  "芝加哥": "Chicago", "西雅图": "Seattle", "西雅圖": "Seattle",
  "旧金山": "San Francisco", "舊金山": "San Francisco", "三藩市": "San Francisco",
  "洛杉矶": "Los Angeles", "洛杉磯": "Los Angeles", "拉斯维加斯": "Las Vegas",
  "拉斯維加斯": "Las Vegas", "迈阿密": "Miami", "邁阿密": "Miami",
  "奥兰多": "Orlando", "休斯顿": "Houston", "休士頓": "Houston",
  "达拉斯": "Dallas", "丹佛": "Denver", "凤凰城": "Phoenix", "底特律": "Detroit",
  "费城": "Philadelphia", "檀香山": "Honolulu", "火奴鲁鲁": "Honolulu",
  "巴尔的摩": "Baltimore", "克利夫兰": "Cleveland", "匹兹堡": "Pittsburgh",
  "圣路易斯": "St. Louis", "明尼阿波利斯": "Minneapolis", "波特兰": "Portland",
  "盐湖城": "Salt Lake City", "圣安东尼奥": "San Antonio", "萨克拉门托": "Sacramento",
  "瓜达拉哈拉": "Guadalajara",
  "安克雷奇": "Anchorage", "多伦多": "Toronto", "多倫多": "Toronto",
  "温哥华": "Vancouver", "溫哥華": "Vancouver", "蒙特利尔": "Montreal",
  "蒙特婁": "Montreal", "卡尔加里": "Calgary", "渥太华": "Ottawa",
  "渥太華": "Ottawa", "魁北克": "Québec", "魁北克市": "Québec", "墨西哥城": "Mexico City",
  "坎昆": "Cancun", "哈瓦那": "Havana",
  // 南美
  "里约热内卢": "Rio de Janeiro", "里約熱內盧": "Rio de Janeiro",
  "圣保罗": "Sao Paulo", "聖保羅": "Sao Paulo", "布宜诺斯艾利斯": "Buenos Aires",
  "布宜諾斯艾利斯": "Buenos Aires", "圣地亚哥": "Santiago", "聖地亞哥": "Santiago",
  "利马": "Lima", "波哥大": "Bogota", "库斯科": "Cusco",
  // 大洋洲非洲
  "悉尼": "Sydney", "雪梨": "Sydney", "墨尔本": "Melbourne", "墨爾本": "Melbourne",
  "布里斯班": "Brisbane", "珀斯": "Perth", "凯恩斯": "Cairns", "凱恩斯": "Cairns",
  "霍巴特": "Hobart", "奥克兰": "Auckland", "奧克蘭": "Auckland",
  "惠灵顿": "Wellington", "皇后镇": "Queenstown", "皇后鎮": "Queenstown",
  "开普敦": "Cape Town", "约翰内斯堡": "Johannesburg", "约翰尼斯堡": "Johannesburg",
  "内罗毕": "Nairobi", "卡萨布兰卡": "Casablanca", "开罗": "Cairo", "馬拉喀什": "Marrakesh",
  "马拉喀什": "Marrakesh",
};

/* Wikipedia 消歧义/旗帜条目修正：默认条目名 → 实际可用条目
 * （New_York/Queenstown/Cartagena 主条目是消歧义页无主图，需用具体城市条目；
 *  Hong_Kong/Macau/Singapore/Penang/Quebec 主条目主图是区旗/国旗 SVG，
 *  换用地标/城区条目取城市街景——搜索路径 wikiTitle=enName 也会经过此表） */
const WIKI_DISAMBIG = {
  "New York": "New_York_City",
  "New_York": "New_York_City",
  "Queenstown": "Queenstown,_New_Zealand",
  "Cartagena": "Cartagena,_Colombia",
  "Portland": "Portland,_Oregon",
  "Cordoba": "Córdoba,_Argentina",
  "Córdoba": "Córdoba,_Argentina",
  "Córdoba, Argentina": "Córdoba,_Argentina",
  "Hong Kong": "Kowloon",
  "Hong_Kong": "Kowloon",
  "Macau": "Macau Peninsula",
  "Macao": "Macau Peninsula",
  "Macau_Peninsula": "Macau Peninsula",
  "Singapore": "Marina_Bay,_Singapore",
  "Penang": "George_Town,_Penang",
  "Québec": "Quebec City",
  "Quebec": "Quebec City",
};

/* 反向词典：英文官方名 → 中文显示名（取该英文名的第一个中文词条）
 * en 语言搜索结果作为候选时，用它把显示名反译成中文 */
const CITY_ZH_EN_REV = (() => {
  const rev = {};
  for (const [zh, en] of Object.entries(CITY_ZH_EN)) {
    if (!rev[en]) rev[en] = zh; // 先到先得：简体优先于繁体（对象插入序）
  }
  return rev;
})();

/* 预置城市：名称中英文均可，geocode 时会自动解析经纬度与时区 */
const CITIES = [
  { id: "beijing",    name: "北京",   query: "Beijing",       flag: "🇨🇳", country: "中国" },
  { id: "shanghai",   name: "上海",   query: "Shanghai",      flag: "🇨🇳", country: "中国" },
  { id: "hongkong",   name: "香港",   query: "Hong Kong",     flag: "🇭🇰", country: "中国香港" },
  { id: "taipei",     name: "台北",   query: "Taipei",        flag: "🇹🇼", country: "中国台湾" },
  { id: "tokyo",      name: "东京",   query: "Tokyo",         flag: "🇯🇵", country: "日本" },
  { id: "seoul",      name: "首尔",   query: "Seoul",         flag: "🇰🇷", country: "韩国" },
  { id: "singapore",  name: "新加坡", query: "Singapore",     flag: "🇸🇬", country: "新加坡" },
  { id: "bangkok",    name: "曼谷",   query: "Bangkok",       flag: "🇹🇭", country: "泰国" },
  { id: "london",     name: "伦敦",   query: "London",        flag: "🇬🇧", country: "英国" },
  { id: "paris",      name: "巴黎",   query: "Paris",         flag: "🇫🇷", country: "法国" },
  { id: "berlin",     name: "柏林",   query: "Berlin",        flag: "🇩🇪", country: "德国" },
  { id: "newyork",    name: "纽约",   query: "New York",      flag: "🇺🇸", country: "美国" },
  { id: "sanfrancisco", name: "旧金山", query: "San Francisco", flag: "🇺🇸", country: "美国" },
  { id: "sydney",     name: "悉尼",   query: "Sydney",        flag: "🇦🇺", country: "澳大利亚" },
  { id: "moscow",     name: "莫斯科", query: "Moscow",        flag: "🇷🇺", country: "俄罗斯" },
  { id: "dubai",      name: "迪拜",   query: "Dubai",         flag: "🇦🇪", country: "阿联酋" },
];

/* 刷新周期（毫秒） */
const CLOCK_TICK_MS = 1000;        // 翻页时钟每秒走
const WEATHER_REFRESH_MS = 10 * 60 * 1000;  // 天气每 10 分钟刷新

/* localStorage 键名 */
const LS_CITY_KEY = "weathercard.city";
