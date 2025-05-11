// src/co// src/components/KanaQuiz.jsx

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Grid,
  Alert
} from '@mui/material';
import { getRandomKana, kanaGroups, getGroupInfo } from '../data/kana';

// 四個關卡設定：名稱與過關題數
const LEVELS = [
  { name: "第一關：選羅馬拼音", need: 5 },
  { name: "第二關：選五十音", need: 7 },
  { name: "第三關：打五十音", need: 10 },
  { name: "第四關：三連拼音", need: 10 }
];

const KanaQuiz = () => {
  // ——— State 宣告 ———
  // currentKana: { kana: 'あ', romaji: 'a' }
  const [currentKana, setCurrentKana] = useState({ kana: '', romaji: '' });
  const [lastRomaji, setLastRomaji] = useState('');      // 避免第一關重複出同一拼音
  const [lastKanas, setLastKanas] = useState([]);        // 避免第二／三關重複出同一假名
  const [options, setOptions] = useState([]);            // 當前選項：字串陣列或物件陣列
  const [level, setLevel] = useState(0);                 // 目前關卡 index
  const [selectedGroups, setSelectedGroups] = useState([]); // 已選假名組（平假、片假各行）
  const [score, setScore] = useState(0);                 // 當前關卡分數
  const [wrongCount, setWrongCount] = useState(0);       // 累計錯誤數
  const [userAnswer, setUserAnswer] = useState('');      // 第3／4關輸入值
  const [showAnswer, setShowAnswer] = useState(false);   // 顯示正確答案
  const [lastWrong, setLastWrong] = useState(false);     // 題目已錯誤、禁止重複觸發
  const [showTypeSelector, setShowTypeSelector] = useState(true); // 顯示組別選擇
  const [showCompletionDialog, setShowCompletionDialog] = useState(false); // 顯示完成彈窗

  // ——— 切換假名組別（平假名／片假名各行） ———
  const handleGroupToggle = (type, row) => {
    const groupInfo = getGroupInfo(type, row);
    setSelectedGroups(prev => {
      const exists = prev.some(g => g.type === type && g.name === row);
      if (exists) {
        return prev.filter(g => !(g.type === type && g.name === row));
      } else {
        return [...prev, groupInfo];
      }
    });
  };

  // ——— 出題函式：處理四個關卡的題目生成 ———
  const generateNewQuestion = () => {
    // 清理上一題狀態
    setUserAnswer('');
    setShowAnswer(false);
    setLastWrong(false);

    let newKana;
    let newOptions = [];

    // 第一關：選羅馬拼音
    if (level === 0) {
      const allKana = selectedGroups.flatMap(g => g.items);
      const uniqueRomaji = Array.from(new Set(allKana.map(k => k.romaji)));
      if (uniqueRomaji.length === 0) return;

      // 隨機取得一個不重複上次的羅馬拼音
      let correctRomaji;
      do {
        correctRomaji = uniqueRomaji[
          Math.floor(Math.random() * uniqueRomaji.length)
        ];
      } while (uniqueRomaji.length > 1 && correctRomaji === lastRomaji);
      setLastRomaji(correctRomaji);

      // 找出所有對應的假名，隨機挑一個平/片假名
      const candidates = allKana.filter(k => k.romaji === correctRomaji);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];

      setCurrentKana({ kana: chosen.kana, romaji: correctRomaji });

      // 干擾選項：排除正解拼音，再隨機抽 3 個
      const distractors = uniqueRomaji.filter(r => r !== correctRomaji);
      newOptions = [
        ...distractors.sort(() => Math.random() - 0.5).slice(0, 3),
        correctRomaji
      ].sort(() => Math.random() - 0.5);
      setOptions(newOptions);

    // 第二關：選假名 (平假 or 片假)
    } else if (level === 1) {
      // 隨機取得一個不重複的假名物件
      do {
        newKana = getRandomKana(selectedGroups);
      } while (lastKanas.includes(newKana));
      setLastKanas([newKana]);

      // 找此假名屬於哪種 type (hiragana / katakana)
      const grp = selectedGroups.find(g =>
        g.items.some(k => k.kana === newKana.kana)
      );
      // 擷取相同 type 的所有假名，排除正解，抽 3 個干擾
      const sameType = selectedGroups
        .filter(g => g.type === grp.type)
        .flatMap(g => g.items);
      const distractors2 = sameType.filter(k => k.kana !== newKana.kana);
      newOptions = [
        ...distractors2.sort(() => Math.random() - 0.5).slice(0, 3),
        newKana
      ].sort(() => Math.random() - 0.5);

      setOptions(newOptions);
      setCurrentKana({ kana: newKana.kana, romaji: newKana.romaji });

    // 第三關：打羅馬拼音
    } else if (level === 2) {
      do {
        newKana = getRandomKana(selectedGroups);
      } while (lastKanas[0] === newKana);
      setLastKanas([newKana]);

      setCurrentKana({ kana: newKana.kana, romaji: newKana.romaji });
      setOptions([]); // 第三關沒有按鈕

    // 第四關：三連拼音
    } else if (level === 3) {
      const allKana = selectedGroups.flatMap(g => g.items);
      if (allKana.length < 3) {
        setOptions([]);
        return;
      }
      newOptions = allKana.sort(() => Math.random() - 0.5).slice(0, 3);
      setOptions(newOptions);
      setCurrentKana({ kana: '', romaji: '' });
    }
  };

  // ——— 開始測驗 & 重新開始 ———
  const handleStartQuiz = () => {
    if (selectedGroups.length === 0) {
      alert('請至少選擇一組假名');
      return;
    }
    setShowTypeSelector(false);
    setLevel(0);
    setScore(0);
    setWrongCount(0);
    generateNewQuestion();
  };
  const handleRestart = () => {
    setShowTypeSelector(true);
    setShowCompletionDialog(false);
    setSelectedGroups([]);
    setScore(0);
    setWrongCount(0);
  };

  // ——— 處理按鈕選項點擊及輸入提交 ———
  const handleOptionClick = (opt) => {
    if (showAnswer && !lastWrong) return;

    // 第一關
    if (level === 0) {
      if (opt === currentKana.romaji) {
        setScore(s => {
          nextQuestion(s + 1);
          return s + 1;  // +1 分
        });
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(undefined, true), 1200);
      }

    // 第二關
    } else if (level === 1) {
      if (opt.kana === currentKana.kana) {
        setScore(s => {
          nextQuestion(s + 1);
          return s + 1;
        });
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(undefined, true), 1200);
      }
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // 第三關
    if (level === 2) {
      const correct = userAnswer.toLowerCase() === currentKana.romaji;
      if (correct) {
        setScore(s => {
          nextQuestion(s + 1);
          return s + 1;
        });
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(undefined, true), 1200);
      }

    // 第四關
    } else if (level === 3) {
      const correct = userAnswer.replace(/\s+/g, '').toLowerCase()
        === options.map(k => k.romaji).join('');
      if (correct) {
        setScore(s => {
          nextQuestion(s + 1);
          return s + 1;
        });
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(undefined, true), 1200);
      }
    }
  };

  // ——— 下一題／過關／重置分數 ———
  const nextQuestion = (nextScore = score, forceNext = false) => {
    setShowAnswer(false);
    setLastWrong(false);

    if (!forceNext && nextScore >= LEVELS[level].need) {
      // 過關
      if (level < 3) {
        setLevel(l => l + 1);
        setScore(0);   // 新關分數歸零
      } else {
        setShowCompletionDialog(true);
      }
    } else {
      // 同一關下一題
      generateNewQuestion();
    }
  };

  // ——— 音組選擇面板 ———
  const renderGroupSelector = () => {
    const types = ['hiragana', 'katakana'];
    const labels = { hiragana: '平假名', katakana: '片假名' };
    const basic = ['あ行','か行','さ行','た行','な行','は行','ま行','や行','ら行','わ行'];
    const daku = ['が行','ざ行','だ行','ば行'];
    const handaku = ['ぱ行'];
    const kBasic = ['ア行','カ行','サ行','タ行','ナ行','ハ行','マ行','ヤ行','ラ行','ワ行'];
    const kDaku = ['ガ行','ザ行','ダ行','バ行'];
    const kHandaku = ['パ行'];

    const renderSection = (type, rows, title) => (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Grid container spacing={1}>
          {rows.map(row => {
            const sel = selectedGroups.some(g => g.type===type && g.name===row);
            return (
              <Grid item xs={6} sm={4} md={3} key={`${type}-${row}`}>
                <Paper
                  elevation={sel?3:1}
                  sx={{
                    p:2, cursor:'pointer',
                    bgcolor: sel?'primary.light':'background.paper'
                  }}
                  onClick={()=>handleGroupToggle(type, row)}
                >
                  <Box sx={{ display:'flex', alignItems:'center' }}>
                    <Checkbox
                      checked={sel}
                      onChange={()=>handleGroupToggle(type, row)}
                      onClick={e=>e.stopPropagation()}
                    />
                    <Box>
                      <Typography>{row}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {kanaGroups[type][row].map(k=>k.kana).join(' ')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );

    return (
      <Box>
        {types.map(type => (
          <Box key={type} sx={{ mb:4 }}>
            <Typography variant="h5" gutterBottom>{labels[type]}</Typography>
            {renderSection(type, type==='hiragana'?basic:kBasic, '基本音')}
            {renderSection(type, type==='hiragana'?daku:kDaku, '濁音')}
            {renderSection(type, type==='hiragana'?handaku:kHandaku, '半濁音')}
          </Box>
        ))}
      </Box>
    );
  };

  // ——— 初次出題 & 關卡變動觸發 ———
  useEffect(() => {
    if (!showTypeSelector) {
      generateNewQuestion();
    }
    // eslint-disable-next-line
  }, [level]);

  // ——— 最終回傳 UI ———
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p:4, mt:4 }}>
        {/* 標題與分數 */}
        <Box sx={{ textAlign:'center', mb:4 }}>
          <Typography variant="h4" gutterBottom>五十音測驗</Typography>
          {!showTypeSelector && (
            <>
              <Typography variant="h6">
                {LEVELS[level].name}
              </Typography>
              <Typography variant="body1">
                分數: {score} / {LEVELS[level].need}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                錯誤: {wrongCount}
              </Typography>
            </>
          )}
        </Box>

        {/* 顯示組別選擇 */}
        {showTypeSelector ? (
          <Box>
            <Typography gutterBottom>請選擇要練習的假名組（至少一組）：</Typography>
            {renderGroupSelector()}
            <Box sx={{ textAlign:'center', mt:2 }}>
              <Button
                variant="contained"
                onClick={handleStartQuiz}
                disabled={!selectedGroups.length}
              >
                開始測驗
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* 第一關：選羅馬拼音 */}
            {level===0 && (
              <Box sx={{ textAlign:'center', mb:3 }}>
                <Typography variant="h1" sx={{ fontSize:'4rem', mb:2 }}>
                  {currentKana.kana}
                </Typography>
                <Grid container spacing={2}>
                  {options.map(opt => (
                    <Grid item xs={6} key={opt}>
                      <Button
                        fullWidth
                        onClick={()=>handleOptionClick(opt)}
                        disabled={showAnswer && !lastWrong}
                      >
                        {opt}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* 第二關：選假名 */}
            {level===1 && (
              <Box sx={{ textAlign:'center', mb:3 }}>
                <Typography variant="h2" sx={{ mb:2 }}>
                  {currentKana.romaji}
                </Typography>
                <Grid container spacing={2}>
                  {options.map((opt,i) => (
                    <Grid item xs={6} key={i}>
                      <Button
                        fullWidth
                        onClick={()=>handleOptionClick(opt)}
                        disabled={showAnswer && !lastWrong}
                      >
                        {opt.kana}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* 第三關：打五十音 */}
            {level===2 && (
              <Box sx={{ textAlign:'center', mb:3 }}>
                <Typography variant="h1" sx={{ fontSize:'4rem', mb:2 }}>
                  {currentKana.kana}
                </Typography>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="輸入羅馬拼音"
                    value={userAnswer}
                    onChange={e=>setUserAnswer(e.target.value)}
                    disabled={showAnswer && lastWrong}
                  />
                  <Button type="submit" variant="contained" sx={{ mt:2 }}>
                    提交
                  </Button>
                </form>
              </Box>
            )}

            {/* 第四關：三連拼音 */}
            {level===3 && (
              <Box sx={{ textAlign:'center', mb:3 }}>
                <Box sx={{ display:'flex', justifyContent:'center', mb:2 }}>
                  {options.map((k,i)=>(
                    <Typography key={i} variant="h1" sx={{ fontSize:'3rem', mx:1 }}>
                      {k.kana}
                    </Typography>
                  ))}
                </Box>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="連續輸入三個拼音"
                    value={userAnswer}
                    onChange={e=>setUserAnswer(e.target.value)}
                    disabled={showAnswer && lastWrong}
                  />
                  <Button type="submit" variant="contained" sx={{ mt:2 }}>
                    提交
                  </Button>
                </form>
              </Box>
            )}

            {/* 錯誤提示 */}
            {showAnswer && lastWrong && (
              <Typography color="error" sx={{ textAlign:'center', mt:2 }}>
                錯誤！正確答案：{
                  level===0 ? currentKana.romaji :
                  level===1 ? currentKana.kana :
                  level===3 ? options.map(k=>k.romaji).join('') :
                  currentKana.romaji
                }
              </Typography>
            )}
          </>
        )}

        {/* 完成對話框 */}
        <Dialog open={showCompletionDialog} onClose={()=>setShowCompletionDialog(false)}>
          <DialogTitle>測驗完成！</DialogTitle>
          <DialogContent>
            <Typography>恭喜完成所有關卡！</Typography>
            <Typography>總錯誤題數：{wrongCount}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRestart}>重新開始</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default KanaQuiz;
