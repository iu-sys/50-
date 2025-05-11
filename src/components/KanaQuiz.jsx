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

const LEVELS = [
  { name: "第一關：選羅馬拼音", need: 5 },
  { name: "第二關：選五十音", need: 7 },
  { name: "第三關：打五十音", need: 10 },
  { name: "第四關：三連拼音", need: 10 }
];

const KanaQuiz = () => {
  // ——— State 宣告 ———
  const [currentKana, setCurrentKana] = useState({
    kana: '',    // 用於第2~4關
    hira: '',    // 平假名（第1關）
    kata: '',    // 片假名（第1關）
    romaji: ''   // 羅馬拼音（第1關 & 第3關 & 第4關比對）
  });
  const [lastRomaji, setLastRomaji] = useState('');      // 避免第1關重複
  const [options, setOptions] = useState([]);            // 當前按鈕選項 (string[] or object[])
  const [level, setLevel] = useState(0);                 // 關卡 0~3
  const [selectedGroups, setSelectedGroups] = useState([]); // 使用者選的音組
  const [lastKanas, setLastKanas] = useState([]);        // 第2~3關避免同一題
  const [userAnswer, setUserAnswer] = useState('');      // 第3~4關輸入
  const [showAnswer, setShowAnswer] = useState(false);   // 顯示正確答案
  const [lastWrong, setLastWrong] = useState(false);     // 避免重複觸發
  const [wrongCount, setWrongCount] = useState(0);       // 總錯誤次數
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // ——— 切換音組 ———
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

  // ——— 出題函式 ———
  const generateNewQuestion = () => {
    // 先清除前一次的答題狀態
    setUserAnswer('');
    setShowAnswer(false);
    setLastWrong(false);

    let newKana;
    let newOptions = [];

    if (level === 0) {
      // —— 第1關：選羅馬拼音 —— 
      const allKana = selectedGroups.flatMap(g => g.items);
      const uniqueRomaji = Array.from(new Set(allKana.map(k => k.romaji)));
      if (uniqueRomaji.length === 0) return;

      // 隨機取不重複上次的 roman
      let correctRomaji;
      do {
        correctRomaji = uniqueRomaji[
          Math.floor(Math.random() * uniqueRomaji.length)
        ];
      } while (uniqueRomaji.length > 1 && correctRomaji === lastRomaji);
      setLastRomaji(correctRomaji);

      // 找對應的平假名 & 片假名
      const hiraChar = allKana.find(k =>
        k.romaji === correctRomaji &&
        selectedGroups.some(g => g.type === 'hiragana' && g.items.includes(k))
      )?.kana || '';
      const kataChar = allKana.find(k =>
        k.romaji === correctRomaji &&
        selectedGroups.some(g => g.type === 'katakana' && g.items.includes(k))
      )?.kana || '';

      // 設定題目
      setCurrentKana({ kana: '', hira: hiraChar, kata: kataChar, romaji: correctRomaji });

      // 干擾選項
      const distractors = uniqueRomaji.filter(r => r !== correctRomaji);
      newOptions = [
        ...distractors.sort(() => Math.random() - 0.5).slice(0, 3),
        correctRomaji
      ].sort(() => Math.random() - 0.5);
      setOptions(newOptions);

    } else if (level === 1) {
      // —— 第2關：選假名 —— 
      do {
        newKana = getRandomKana(selectedGroups);
      } while (lastKanas.includes(newKana));
      setLastKanas([newKana]);

      // 只取同一 type
      const sameType = selectedGroups
        .filter(g => g.type === newKana.type)
        .flatMap(g => g.items);
      const others = sameType.filter(k =>
        k.kana !== newKana.kana && !lastKanas.includes(k)
      );
      newOptions = [
        ...others.sort(() => Math.random() - 0.5).slice(0, 3),
        newKana
      ].sort(() => Math.random() - 0.5);

      setOptions(newOptions);
      setCurrentKana({ kana: newKana.kana, hira: '', kata: '', romaji: newKana.romaji });

    } else if (level === 2) {
      // —— 第3關：打五十音 —— 
      do {
        newKana = getRandomKana(selectedGroups);
      } while (lastKanas[0] === newKana);
      setLastKanas([newKana]);

      setCurrentKana({ kana: newKana.kana, hira: '', kata: '', romaji: newKana.romaji });
      setOptions([]);

    } else if (level === 3) {
      // —— 第4關：三連拼音 —— 
      const allKana = selectedGroups.flatMap(g => g.items);
      if (allKana.length < 3) {
        setOptions([]);
        return;
      }
      newOptions = allKana.sort(() => Math.random() - 0.5).slice(0, 3);
      setOptions(newOptions);
      setCurrentKana({ kana: '', hira: '', kata: '', romaji: '' });
    }
  };

  // ——— 開始測驗 & 重玩 ———
  const handleStartQuiz = () => {
    if (selectedGroups.length === 0) {
      alert('請至少選擇一組五十音');
      return;
    }
    setShowTypeSelector(false);
    setLevel(0);
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

  // ——— 答題點擊/提交 ———
  const handleOptionClick = (opt) => {
    if (showAnswer && !lastWrong) return;
    if (level === 0) {
      // 第一關：opt 為字串 roman
      if (opt === currentKana.romaji) {
        setScore(s => {
          const next = s + 1;
          nextQuestion(next);
          return next;
        });
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(undefined, true), 1200);
      }
    } else if (level === 1) {
      // 第二關：opt 為 {kana,romaji}
      if (opt.kana === currentKana.kana) {
        setScore(s => {
          const next = s + 1;
          nextQuestion(next);
          return next;
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
    if (level === 2) {
      const correct = userAnswer.toLowerCase() === currentKana.romaji;
      if (correct) {
        setScore(s => {
          const next = s + 1;
          nextQuestion(next);
          return next;
        });
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(undefined, true), 1200);
      }
    } else if (level === 3) {
      const correct = userAnswer.replace(/\s+/g, '').toLowerCase()
        === options.map(k => k.romaji).join('');
      if (correct) {
        setScore(s => {
          const next = s + 1;
          nextQuestion(next);
          return next;
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

  // ——— 下一題/過關 ———
  const [score, setScore] = useState(0);
  const nextQuestion = (nextScore = score, forceNext = false) => {
    setShowAnswer(false);
    setLastWrong(false);
    if (!forceNext && nextScore >= LEVELS[level].need) {
      if (level < 3) setLevel(l => l + 1);
      else setShowCompletionDialog(true);
    } else {
      generateNewQuestion();
    }
  };

  // ——— 顯示音組選單 ———
  const renderGroupSelector = () => {
    const types = ['hiragana', 'katakana'];
    const typeLabels = {
      hiragana: '平假名 (ひらがな)',
      katakana: '片假名 (カタカナ)'
    };
    const basicRows = ['あ行','か行','さ行','た行','な行','は行','ま行','や行','ら行','わ行'];
    const dakuonRows = ['が行','ざ行','だ行','ば行'];
    const handakuonRows = ['ぱ行'];
    const katBasic = ['ア行','カ行','サ行','タ行','ナ行','ハ行','マ行','ヤ行','ラ行','ワ行'];
    const katDakuon = ['ガ行','ザ行','ダ行','バ行'];
    const katHanda = ['パ行'];

    const renderSection = (type, rows, title) => (
      <Box sx={{ mb:4 }}>
        <Typography variant="h6" sx={{ mb:2, color:'primary.main', pb:1, borderBottom:'2px solid' }}>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {rows.map(row => {
            const isSel = selectedGroups.some(g => g.type===type && g.name===row);
            return (
              <Grid item xs={6} sm={4} md={3} key={row}>
                <Paper
                  elevation={isSel?3:1}
                  sx={{
                    p:2, cursor:'pointer',
                    bgcolor:isSel?'primary.light':'background.paper',
                    '&:hover':{ bgcolor:isSel?'primary.light':'action.hover' }
                  }}
                  onClick={()=>handleGroupToggle(type,row)}
                >
                  <Box sx={{ display:'flex', alignItems:'center' }}>
                    <Checkbox
                      checked={isSel}
                      onChange={()=>handleGroupToggle(type,row)}
                      onClick={e=>e.stopPropagation()}
                    />
                    <Box>
                      <Typography variant="subtitle1">{row}</Typography>
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
      <Box sx={{ mt:2 }}>
        {types.map(type=>(
          <Box key={type} sx={{ mb:6 }}>
            <Typography variant="h5" sx={{ mb:3, fontWeight:'bold', color:'primary.dark' }}>
              {typeLabels[type]}
            </Typography>
            {renderSection(type, type==='hiragana'?basicRows:katBasic, '基本音')}
            {renderSection(type, type==='hiragana'?dakuonRows:katDakuon, '濁音')}
            {renderSection(type, type==='hiragana'?handakuonRows:katHanda, '半濁音')}
          </Box>
        ))}
      </Box>
    );
  };

  // —— 初次出題及關卡變動時 —— 
  useEffect(()=>{
    if (!showTypeSelector) generateNewQuestion();
    // eslint-disable-next-line
  },[level]);

  // ——— 最終回傳 UI ———
  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p:4, mt:4 }}>
        <Box sx={{ textAlign:'center', mb:4 }}>
          <Typography variant="h4" gutterBottom>五十音測驗</Typography>
          {!showTypeSelector && (
            <>
              <Typography variant="h5" color="primary" gutterBottom>
                {LEVELS[level].name}
              </Typography>
              <Typography variant="h6" gutterBottom>
                分數: {score} / {LEVELS[level].need}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                錯誤: {wrongCount}
              </Typography>
              <Typography variant="subtitle2" color="primary">
                已選組: {selectedGroups.length}
              </Typography>
            </>
          )}
        </Box>

        {showTypeSelector ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              選擇欲練習之五十音組（至少一組）：
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleStartQuiz}
              disabled={selectedGroups.length===0}
              sx={{ mb:2 }}
            >
              開始測驗
            </Button>
            {renderGroupSelector()}
          </Box>
        ) : (
          <>
            {/* 第一關 */}
            {level===0 && (
              <>
                <Typography
                  variant="h1"
                  sx={{
                    display:'flex',
                    justifyContent:'center',
                    gap:4,
                    fontSize:'4rem',
                    mb:2
                  }}
                >
                  {currentKana.hira} {currentKana.kata}
                </Typography>
                <Grid container spacing={2}>
                  {options.map(opt=>(
                    <Grid item xs={6} key={opt}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={()=>handleOptionClick(opt)}
                        disabled={showAnswer && !lastWrong}
                        sx={{ fontSize:'1.2rem', height:60, textTransform:'none' }}
                      >
                        {opt}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* 第二關 */}
            {level===1 && (
              <>
                <Typography variant="h1" sx={{ fontSize:'3rem', mb:2 }}>
                  {currentKana.romaji.toLowerCase()}
                </Typography>
                <Grid container spacing={2}>
                  {options.map((opt,i)=>(
                    <Grid item xs={6} key={i}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={()=>handleOptionClick(opt)}
                        disabled={showAnswer && !lastWrong}
                        sx={{
                          fontSize:'2rem',
                          height:60,
                          bgcolor: showAnswer && opt.kana===currentKana.kana
                            ? 'success.light' : 'inherit'
                        }}
                      >
                        {opt.kana}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* 第三關 */}
            {level===2 && (
              <Box sx={{ textAlign:'center', mb:4 }}>
                <Typography variant="h1" sx={{ fontSize:'4rem', mb:2 }}>
                  {currentKana.kana}
                </Typography>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="請輸入羅馬拼音"
                    value={userAnswer}
                    onChange={e=>setUserAnswer(e.target.value)}
                    disabled={showAnswer && lastWrong}
                    sx={{ mb:2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={showAnswer && lastWrong}
                  >
                    提交
                  </Button>
                </form>
              </Box>
            )}

            {/* 第四關 */}
            {level===3 && (
              <Box sx={{ textAlign:'center', mb:4 }}>
                <Box sx={{ display:'flex', justifyContent:'center', gap:2, mb:2 }}>
                  {options.map((k,i)=>(
                    <Typography key={i} variant="h1" sx={{ fontSize:'4rem' }}>
                      {k.kana}
                    </Typography>
                  ))}
                </Box>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="連續輸入三個羅馬拼音"
                    value={userAnswer}
                    onChange={e=>setUserAnswer(e.target.value)}
                    disabled={showAnswer && lastWrong}
                    sx={{ mb:2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={showAnswer && lastWrong}
                  >
                    提交
                  </Button>
                </form>
              </Box>
            )}

            {/* 錯誤提示 */}
            {showAnswer && lastWrong && (
              <Typography variant="h6" color="error" sx={{ textAlign:'center', mt:2 }}>
                錯誤！正確答案是{' '}
                {level===0 
                  ? currentKana.romaji.toLowerCase()
                  : level===1 
                    ? currentKana.kana 
                    : level===3 
                      ? options.map(k=>k.romaji).join('') 
                      : currentKana.romaji.toLowerCase()
                }
              </Typography>
            )}
          </>
        )}

        {/* 完成對話框 */}
        <Dialog open={showCompletionDialog} onClose={()=>setShowCompletionDialog(false)}>
          <DialogTitle>測驗完成！</DialogTitle>
          <DialogContent>
            <Typography>恭喜您完成所有關卡！</Typography>
            <Typography>總錯誤題數：{wrongCount}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRestart} variant="contained">重新開始</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default KanaQuiz;
