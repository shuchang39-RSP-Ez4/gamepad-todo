import { useState, useEffect, useRef } from 'react';
import { useGamepad } from './hooks/useGamepad';
import { sfx } from './utils/sound';

interface HomeworkItem {
  id: string;
  title: string;
  totalPoints: number;
  earnedPoints: number;
}

interface SummerConfig {
  startDate: string;
  endDate: string;
}

const STORAGE_KEY = 'summer_homework_burndown_v12';

const INITIAL_CONFIG: SummerConfig = {
  startDate: '2026-09-20',
  endDate: '2026-09-30',
};

const INITIAL_HOMEWORK: HomeworkItem[] = [
  { id: '1', title: '計算ドリル', totalPoints: 20, earnedPoints: 0 },
  { id: '2', title: '漢字ドリル', totalPoints: 20, earnedPoints: 0 },
  { id: '3', title: '絵日記 × 5日分', totalPoints: 15, earnedPoints: 0 },
  { id: '4', title: '読書感想文', totalPoints: 20, earnedPoints: 0 },
  { id: '5', title: '自由研究（標準）', totalPoints: 30, earnedPoints: 0 },
  { id: '6', title: '工作（標準）', totalPoints: 20, earnedPoints: 0 },
  { id: '7', title: '観察記録 × 20日', totalPoints: 10, earnedPoints: 0 },
  { id: '8', title: 'ラジオ体操 × 20日', totalPoints: 10, earnedPoints: 0 },
  { id: '9', title: '読書記録 × 3冊', totalPoints: 6, earnedPoints: 0 },
];

function isJapaneseHoliday(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m === 7 && d === 20) return true;
  if (m === 8 && d === 11) return true;
  if (m === 9 && d === 22) return true;
  return false;
}

export default function App() {
  const [config, setConfig] = useState<SummerConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CONFIG;
  });

  const [homeworks, setHomeworks] = useState<HomeworkItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_items');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_HOMEWORK;
  });

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isParentMode, setIsParentMode] = useState<boolean>(false);
  
  const [newTitle, setNewTitle] = useState<string>('');
  const [newPoints, setNewPoints] = useState<string>('10');

  const [tempStartDate, setTempStartDate] = useState<string>(config.startDate);
  const [tempEndDate, setTempEndDate] = useState<string>(config.endDate);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_config', JSON.stringify(config));
      localStorage.setItem(STORAGE_KEY + '_items', JSON.stringify(homeworks));
    } catch (e) {
      console.error(e);
    }
  }, [config, homeworks]);

  useEffect(() => {
    if (!isParentMode && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex, isParentMode]);

  const handleUp = () => {
    if (isParentMode || homeworks.length === 0) return;
    setSelectedIndex((prev) => {
      const next = prev > 0 ? prev - 1 : homeworks.length - 1;
      sfx.playMove();
      return next;
    });
  };

  const handleDown = () => {
    if (isParentMode || homeworks.length === 0) return;
    setSelectedIndex((prev) => {
      const next = prev < homeworks.length - 1 ? prev + 1 : 0;
      sfx.playMove();
      return next;
    });
  };

  const handleSelect = () => {
    if (isParentMode || homeworks.length === 0) return;

    setHomeworks((prev) =>
      prev.map((item, index) => {
        if (index === selectedIndex) {
          if (item.earnedPoints < item.totalPoints) {
            sfx.playComplete();
            return { ...item, earnedPoints: item.earnedPoints + 1 };
          } else {
            sfx.playMove();
          }
        }
        return item;
      })
    );
  };

  const handleDelete = () => {
    if (isParentMode || homeworks.length === 0) return;

    setHomeworks((prev) =>
      prev.map((item, index) => {
        if (index === selectedIndex) {
          if (item.earnedPoints > 0) {
            sfx.playMove();
            return { ...item, earnedPoints: item.earnedPoints - 1 };
          }
        }
        return item;
      })
    );
  };

  const { isConnected } = useGamepad({
    onUp: handleUp,
    onDown: handleDown,
    onSelect: handleSelect,
    onDelete: handleDelete,
    enabled: !isParentMode,
  });

  const handleAddHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const pts = parseInt(newPoints, 10) || 10;

    const newItem: HomeworkItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      totalPoints: pts,
      earnedPoints: 0,
    };

    setHomeworks((prev) => [...prev, newItem]);
    setNewTitle('');
    sfx.playComplete();
  };

  const handleRemoveHomework = (id: string) => {
    setHomeworks((prev) => prev.filter((item) => item.id !== id));
    sfx.playMove();
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig({ startDate: tempStartDate, endDate: tempEndDate });
    sfx.playComplete();
    alert('夏休みの期間を保存しました！');
  };

  const totalTargetPoints = homeworks.reduce((acc, cur) => acc + cur.totalPoints, 0);
  const totalEarnedPoints = homeworks.reduce((acc, cur) => acc + cur.earnedPoints, 0);
  const remainingPoints = Math.max(0, totalTargetPoints - totalEarnedPoints);

  const startDateObj = new Date(config.startDate);
  const endDateObj = new Date(config.endDate);
  const timeDiff = endDateObj.getTime() - startDateObj.getTime();
  const totalDays = Math.max(1, Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1);

  const dateList: { dateStr: string; label: string; isSat: boolean; isSunOrHol: boolean }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDateObj);
    d.setDate(startDateObj.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    const dayOfWeek = d.getDay();
    const isSat = dayOfWeek === 6;
    const isSun = dayOfWeek === 0;
    const isHol = isJapaneseHoliday(dateStr);

    dateList.push({
      dateStr,
      label: `${Number(mm)}/${Number(dd)}`,
      isSat,
      isSunOrHol: isSun || isHol,
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDayTime = startDateObj.setHours(0, 0, 0, 0);
  const currentDayDiff = Math.floor((today.getTime() - startDayTime) / (1000 * 60 * 60 * 24));
  const clampedDayIndex = Math.max(0, Math.min(totalDays - 1, currentDayDiff));

  const svgWidth = 540;
  const svgHeight = 340;
  const paddingLeft = 50;
  const paddingRight = 35;
  const paddingTop = 20;
  const paddingBottom = 40;
  
  const graphW = svgWidth - paddingLeft - paddingRight;
  const graphH = svgHeight - paddingTop - paddingBottom;

  const idealStartX = paddingLeft;
  const idealStartY = paddingTop;
  const idealEndX = paddingLeft + graphW;
  const idealEndY = paddingTop + graphH;

  const currentX = paddingLeft + (clampedDayIndex / Math.max(1, totalDays - 1)) * graphW;
  const currentY = paddingTop + ((totalTargetPoints - remainingPoints) / Math.max(1, totalTargetPoints)) * graphH;

  const stepPathData = `
    M ${paddingLeft} ${paddingTop}
    L ${currentX} ${paddingTop}
    L ${currentX} ${currentY}
  `;

  // 20刻みのY軸目盛りを動的に生成（0から総ポイントまで20刻み）
  const yAxisTicks: number[] = [];
  for (let p = 0; p <= totalTargetPoints; p += 20) {
    yAxisTicks.push(p);
  }
  // 最高値（totalTargetPoints）が刻みに含まれていない場合は追加
  if (yAxisTicks[yAxisTicks.length - 1] !== totalTargetPoints) {
    yAxisTicks.push(totalTargetPoints);
  }

  return (
    <div className="h-screen w-screen bg-black text-amber-100 font-mono p-3 flex flex-col items-center justify-center select-none overflow-hidden box-border">
      <div className="w-full max-w-[1400px] h-full max-h-[96vh] bg-blue-950 border-4 border-amber-400 p-4 shadow-[8px_8px_0px_0px_rgba(251,191,36,0.5)] flex flex-col justify-between relative box-border overflow-hidden">
        
        {/* ヘッダー */}
        <div className="border-b-4 border-amber-400 pb-2.5 flex justify-between items-center gap-2 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-widest text-amber-300 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
              🏰 夏休みの宿題クエスト
            </h1>
            <p className="text-xs sm:text-sm text-amber-400/90 font-bold">
              期間: {config.startDate} 〜 {config.endDate} （全 {totalDays} 日間）
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsParentMode(!isParentMode)}
              className="px-3 py-1.5 text-xs border-2 border-amber-400 bg-amber-400/20 hover:bg-amber-400/40 font-bold transition-colors"
            >
              {isParentMode ? '🎮 子どもモードへ' : '🔒 親モード（設定）'}
            </button>

            <div className={`px-3 py-1.5 text-xs border-2 font-extrabold ${isConnected ? 'bg-green-900 border-green-400 text-green-200' : 'bg-red-900 border-red-400 text-red-200'}`}>
              {isConnected ? '🟢 ONLINE' : '🔴 OFFLINE'}
            </div>
          </div>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 my-2 overflow-hidden flex flex-col justify-center">
          {isParentMode ? (
            <div className="space-y-4 bg-blue-900/60 p-5 border-2 border-amber-400/60 overflow-y-auto max-h-full">
              <h2 className="text-base font-bold text-amber-300 border-b-2 border-amber-400/40 pb-2">
                🔒 親モード：夏休み期間 ＆ 宿題の管理
              </h2>

              <form onSubmit={handleSaveConfig} className="bg-blue-950 p-3 border border-amber-400/40 space-y-2">
                <div className="text-xs font-bold text-amber-300">📅 夏休みのスケジュール設定</div>
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 flex-1 text-xs">
                    <span>開始日:</span>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      className="bg-blue-900 border border-amber-400/60 px-2 py-1 text-xs text-amber-100 flex-1 focus:outline-none"
                    />
                  </div>
                  <span className="font-bold">〜</span>
                  <div className="flex items-center gap-2 flex-1 text-xs">
                    <span>終了日:</span>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      className="bg-blue-900 border border-amber-400/60 px-2 py-1 text-xs text-amber-100 flex-1 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-amber-400 text-blue-950 font-bold px-3 py-1 text-xs border border-amber-300 hover:bg-amber-300 shrink-0"
                  >
                    期間を保存
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <div className="text-xs font-bold text-amber-300">📜 宿題・ポイントの追加</div>
                <form onSubmit={handleAddHomework} className="flex gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="宿題タイトル"
                    className="flex-1 bg-blue-950 border border-amber-400/60 px-3 py-1.5 text-xs text-amber-100 placeholder-amber-400/40 focus:outline-none"
                  />
                  <input
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(e.target.value)}
                    placeholder="pt"
                    className="w-20 bg-blue-950 border border-amber-400/60 px-2 py-1.5 text-xs text-amber-100 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-amber-400 text-blue-950 font-bold px-4 py-1.5 text-xs border border-amber-300 hover:bg-amber-300"
                  >
                    追加
                  </button>
                </form>
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {homeworks.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-blue-950 p-2 border border-amber-400/30 text-xs">
                    <span>{item.title} （目標: {item.totalPoints} pt）</span>
                    <button
                      onClick={() => handleRemoveHomework(item.id)}
                      className="text-[10px] bg-red-900 text-red-200 border border-red-500 px-2 py-0.5 hover:bg-red-800 font-bold"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ================= 子どもモード（Y軸20刻み目盛り追加） ================= */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-stretch overflow-hidden">
              
              {/* 左側：リスト */}
              <div className="space-y-2 flex flex-col h-full overflow-hidden">
                <div className="text-xs font-bold text-amber-300 tracking-wider bg-blue-900/60 px-3 py-1.5 border-l-4 border-amber-400 shrink-0">
                  📋 今日のクエスト一覧（[↑↓] 選択 ➔ [A] +1pt）
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto pr-2 border-2 border-blue-900 bg-blue-950/40 p-2.5 min-h-0">
                  {homeworks.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    const isFinished = item.earnedPoints >= item.totalPoints;

                    return (
                      <div
                        key={item.id}
                        ref={(el) => (itemRefs.current[index] = el)}
                        className={`p-3 border-2 transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-blue-900 border-amber-300 translate-x-1.5 shadow-[4px_4px_0px_0px_rgba(251,191,36,0.3)]' 
                            : 'bg-blue-950/90 border-blue-900 opacity-90'
                        }`}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <span className="text-lg">
                            {isFinished ? '🏆' : '📜'}
                          </span>
                          <div>
                            <div className={`text-sm sm:text-base font-bold truncate ${isFinished ? 'text-amber-400/60 line-through' : 'text-amber-100'}`}>
                              {item.title}
                            </div>
                            <div className="text-xs text-amber-400/80">
                              進捗: <span className="text-amber-300 font-bold text-sm">{item.earnedPoints}</span> / {item.totalPoints} pt
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-xs bg-amber-400 text-blue-950 font-black px-2 py-0.5 animate-pulse shrink-0">
                            ▶ SELECT
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 右側：チャート */}
              <div className="bg-blue-900/40 border-2 border-amber-400/60 p-4 flex flex-col justify-between h-full overflow-hidden">
                <div className="flex flex-col h-full justify-between">
                  
                  <div className="flex justify-between items-center border-b border-amber-400/40 pb-1.5 mb-2 shrink-0">
                    <h2 className="text-sm sm:text-base font-extrabold text-amber-300">
                      📊 バーンダウンチャート
                    </h2>
                    <span className="text-xs sm:text-sm font-bold text-amber-300 bg-blue-950 px-2.5 py-0.5 border border-amber-400">
                      残り: {remainingPoints} pt
                    </span>
                  </div>

                  <div className="bg-blue-950 border-2 border-amber-400 flex-1 flex justify-center items-center py-1 relative overflow-hidden shadow-inner min-h-0">
                    <svg 
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                      className="w-full h-full"
                      preserveAspectRatio="none"
                    >
                      {/* 土日祝日の背景色分け */}
                      {dateList.map((d, i) => {
                        const x1 = paddingLeft + (i / Math.max(1, totalDays - 1)) * graphW;
                        const colWidth = graphW / Math.max(1, totalDays);
                        let fillColor = "transparent";
                        if (d.isSunOrHol) fillColor = "rgba(239, 68, 68, 0.15)";
                        else if (d.isSat) fillColor = "rgba(59, 130, 246, 0.15)";

                        return (
                          <rect
                            key={i}
                            x={x1}
                            y={paddingTop}
                            width={Math.max(1, colWidth)}
                            height={graphH}
                            fill={fillColor}
                          />
                        );
                      })}

                      {/* Y軸の20刻みに応じた横グリッド線と数値ラベルの描画 */}
                      {yAxisTicks.map((pt, i) => {
                        // 0ptから総ポイントまでの比率を計算
                        const ratio = totalTargetPoints > 0 ? pt / totalTargetPoints : 0;
                        // グラフの下部が0pt、上部がtotalTargetPointsになるY座標
                        const yPos = paddingTop + graphH - (ratio * graphH);

                        return (
                          <g key={i}>
                            {/* グリッド線（上下の枠線と被る部分を除く） */}
                            {pt > 0 && pt < totalTargetPoints && (
                              <line 
                                x1={paddingLeft} y1={yPos} 
                                x2={paddingLeft + graphW} y2={yPos} 
                                stroke="#1e3a8a" strokeWidth="1" strokeDasharray="3 3" 
                              />
                            )}
                            {/* Y軸の数値ラベル */}
                            <text 
                              x={paddingLeft - 8} 
                              y={yPos + 3} 
                              fill="#fbbf24" 
                              fontSize="9" 
                              fontFamily="monospace" 
                              fontWeight="bold" 
                              textAnchor="end"
                            >
                              {pt}
                            </text>
                          </g>
                        );
                      })}

                      <rect x={paddingLeft} y={paddingTop} width={graphW} height={graphH} fill="none" stroke="#fbbf24" strokeWidth="2" />

                      {/* 理想線（赤の破線） */}
                      <line 
                        x1={idealStartX} y1={idealStartY} 
                        x2={idealEndX} y2={idealEndY} 
                        stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5 3" 
                      />

                      {/* 実績の階段状ライン */}
                      <path 
                        d={stepPathData} 
                        fill="none" 
                        stroke="#fbbf24" 
                        strokeWidth="3.5" 
                      />

                      {/* 現在地ドット */}
                      <circle cx={currentX} cy={currentY} r="5" fill="#fbbf24" />

                      {/* 横軸ラベル（日付） */}
                      {dateList.map((d, i) => {
                        const showLabel = totalDays <= 14 || i === 0 || i === totalDays - 1 || i % Math.ceil(totalDays / 6) === 0;
                        if (!showLabel) return null;

                        const xPos = paddingLeft + (i / Math.max(1, totalDays - 1)) * graphW;
                        
                        let textColor = "#fbbf24";
                        if (d.isSunOrHol) textColor = "#f87171";
                        else if (d.isSat) textColor = "#60a5fa";

                        return (
                          <text
                            key={i}
                            x={xPos}
                            y={paddingTop + graphH + 18}
                            fill={textColor}
                            fontSize="10"
                            fontFamily="monospace"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {d.label}
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  {/* 凡例 */}
                  <div className="text-[11px] sm:text-xs font-bold text-amber-300 border-t border-amber-400/30 pt-1.5 mt-1.5 flex justify-between flex-wrap gap-1 shrink-0">
                    <span>🔴 <span className="text-red-400">日曜・祝日</span></span>
                    <span>🔵 <span className="text-blue-400">土曜日</span></span>
                    <span>📈 <span className="text-red-400">理想(赤)</span> / <span className="text-amber-400">実績(黄)</span></span>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>

        {/* フッター操作ガイド */}
        <div className="border-t-2 border-dashed border-amber-400/50 pt-2 text-xs font-bold text-amber-300 flex flex-wrap justify-between gap-2 shrink-0">
          <span>[↑↓] 宿題をえらぶ</span>
          <span>[Aボタン] +1ポイント (15〜20分)</span>
          <span>[Bボタン] -1ポイント (やり直し)</span>
        </div>

      </div>
    </div>
  );
}