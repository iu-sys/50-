// src/components/KanaQuiz.jsx

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
  Grid
} from '@mui/material';
import { getRandomKana, kanaGroups, getGroupInfo } from '../data/kana';

const LEVELS = [
  { name: "第一關：選羅馬拼音", need: 5 },
  { name: "第二關：選五十音", need: 7 },
  { name: "第三關：打五十音", need: 10 },
  { name: "第四關：三連拼音", need: 10 }
];

const KanaQuiz = () => {
  // — State 宣告 —
  const [currentKana, setCurrentKana] = useState({ kana: '', romaji: '' });
  const [lastRomaji, setLastRomaji] = useState('');
  const [lastKanas, setLastKanas] = useState([]);
  const [options, setOptions] = useState([]);
  const [level, setLevel] = useState(0);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [lastWrong, setLastWrong] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);

  // 切換假名組
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

  // 出題函式
  const generateNewQuestion = () => {
    setUserAnswer('');
    setShowAnswer(false);
    setLastWrong(false);

    let newKana;
    let newOptions = [];

    if (level === 0) {
      // 第一關：選羅馬拼音
      const allKana = selectedGroups.flatMap(g => g.items);
      const uniqueRomaji = Array.from(new Set(allKana.map(k => k.romaji)));
      if (!uniqueRomaji.length) return;

      let correctRomaji;
      do {
        correctRomaji = uniqueRomaji[
          Math.floor(Math.random() * uniqueRomaji.length)
        ];
      } while (uniqueRomaji.length > 1 && correctRomaji === lastRomaji);
      setLastRomaji(correctRomaji);

      const matches = allKana.filter(k => k.romaji === correctRomaji);
      const chosen = matches[Math.floor(Math.random() * matches.length)];

      setCurrentKana({ kana: chosen.kana, romaji: correctRomaji });

      const distractors = uniqueRomaji.filter(r => r !== correctRomaji);
      newOptions = [
        ...distractors.sort(() => Math.random() - 0.5).slice(0, 3),
        correctRomaji
      ].sort(() => Math.random() - 0.5);
      setOptions(newOptions);

    } else if (level === 1) {
      // 第二關：選假名
      do {
        newKana = getRandomKana(selectedGroups);
      } while (lastKanas.includes(newKana));
      setLastKanas([newKana]);

      const grp = selectedGroups.find(g =>
        g.items.some(k => k.kana === newKana.kana)
      );
      const sameType = selectedGroups
        .filter(g => g.type === grp.type)
        .flatMap(g => g.items);

      const others = sameType.filter(k => k.kana !== newKana.kana);
      newOptions = [
        ...others.sort(() => Math.random() - 0.5).slice(0, 3),
        newKana
      ].sort(() => Math.random() - 0.5);

      setOptions(newOptions);
      setCurrentKana({ kana: newKana.kana, romaji: newKana.romaji });

    } else if (level === 2) {
      // 第三關：打五十音
      do {
        newKana = getRandomKana(selectedGroups);
      } while (lastKanas[0] === newKana);
      setLastKanas([newKana]);

      setCurrentKana({ kana: newKana.kana, romaji: newKana.romaji });
      setOptions([]);

    } else if (level === 3) {
      // 第四關：三連拼音
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

  // 開始 & 重玩
  const handleStartQuiz = () => {
    if (!selectedGroups.length) {
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

  // 選項點擊
  const handleOptionClick = (opt) => {
    if (showAnswer && !lastWrong) return;

    if (level === 0) {
      if (opt === currentKana.romaji) {
        setScore(s => s + 1);
        nextQuestion();
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(true), 1200);
      }
    } else if (level === 1) {
      if (opt.kana === currentKana.kana) {
        setScore(s => s + 1);
        nextQuestion();
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(true), 1200);
      }
    }
  };

  // 第三 & 第四關提交
  const handleSubmit = (e) => {
    e.preventDefault();
    if (level === 2) {
      const correct = userAnswer.toLowerCase() === currentKana.romaji;
      if (correct) {
        setScore(s => s + 1);
        nextQuestion();
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(true), 1200);
      }
    } else if (level === 3) {
      const correct = userAnswer.replace(/\s+/g, '').toLowerCase()
        === options.map(k => k.romaji).join('');
      if (correct) {
        setScore(s => s + 1);
        nextQuestion();
      } else {
        setScore(s => Math.max(0, s - 1));
        setWrongCount(w => w + 1);
        setShowAnswer(true);
        setLastWrong(true);
        setTimeout(() => nextQuestion(true), 1200);
      }
    }
  };

  // 下一題 / 過關 / 重置分數
  const nextQuestion = (forceNext = false) => {
    setShowAnswer(false);
    setLastWrong(false);

    if (!forceNext && score >= LEVELS[level].need) {
      if (level < 3) {
        setLevel(l => l + 1);
        setScore(0);
      } else {
        setShowCompletionDialog(true);
      }
    } else {
      generateNewQuestion();
    }
  };

  // 修正後的 renderGroupSelector
  const renderGroupSelector = () => {
    const types = ['hiragana', 'katakana'];
    const typeLabels = {
      hiragana: '平假名 (ひらがな)',
      katakana: '片假名 (カタカナ)'
    };

    const hiraganaRows = {
      basic: ['あ行','か行','さ行','た行','な行','は行','ま行','や行','ら行','わ行'],
      dakuon: ['が行','ざ行','だ行','ば行'],
      handakuon: ['ぱ行']
    };
    const katakanaRows = {
      basic: ['ア行','カ行','サ行','タ行','ナ行','ハ行','マ行','ヤ行','ラ行','ワ行'],
      dakuon: ['ガ行','ザ行','ダ行','バ行'],
      handakuon: ['パ行']
    };

    const renderSection = (type, rows, title) => (
      <Box sx={{ mb:4 }}>
        <Typography variant="h6" sx={{ mb:2, color:'primary.main', borderBottom:'2px solid', pb:1 }}>
          {title}
        </Typography>
        <Grid container spacing={2}>
          {rows.map(row => {
            const isSelected = selectedGroups.some(g => g.type === type && g.name === row);
            return (
              <Grid item xs={6} sm={4} md={3} key={row}>
                <Paper
                  elevation={isSelected ? 3 : 1}
                  sx={{
                    p:2,
                    cursor:'pointer',
                    bgcolor: isSelected ? 'primary.light' : 'background.paper',
                    '&:hover': { bgcolor: isSelected ? 'primary.light' : 'action.hover' }
                  }}
                  onClick={() => handleGroupToggle(type, row)}
                >
                  <Box sx={{ display:'flex', alignItems:'center' }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleGroupToggle(type, row)}
                      onClick={e => e.stopPropagation()}
                    />
                    <Box>
                      <Typography variant="subtitle1">{row}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {kanaGroups[type][row].map(k => k.kana).join(' ')}
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
      // ← 新增這段檢查
  if (!showTypeSelector && options.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h6">題目載入中，請稍候…</Typography>
      </Container>
    );
  }

    return (
      <Box sx={{ mt:2 }}>
        {types.map(type => {
          const rows = type === 'hiragana' ? hiraganaRows : katakanaRows;
          return (
            <Box key={type} sx={{ mb:6 }}>
              <Typography variant="h5" sx={{ mb:3, fontWeight:'bold', color:'primary.dark' }}>
                {typeLabels[type]}
              </Typography>
              {renderSection(type, rows.basic, '基本音')}
              {renderSection(type, rows.dakuon, '濁音')}
              {renderSection(type, rows.handakuon, '半濁音')}
            </Box>
          );
        })}
      </Box>
    );
  };

  // 自動出題
  useEffect(() => {
    if (!showTypeSelector) generateNewQuestion();
    // eslint-disable-next-line
  }, [level]);

  // 最終 UI
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
                已選組數: {selectedGroups.length}
              </Typography>
            </>
          )}
        </Box>

        {showTypeSelector ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              請選擇欲練習之五十音組（至少一組）：
            </Typography>
            {renderGroupSelector()}
            <Box sx={{ textAlign:'center', mt:4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleStartQuiz}
                disabled={!selectedGroups.length}
              >
                開始測驗
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {level === 0 && (
              <Box sx={{ textAlign:'center', mb:4 }}>
                <Typography variant="h1" sx={{ fontSize:'4rem', mb:2 }}>
                  {currentKana.kana}
                </Typography>
                <Grid container spacing={2}>
                  {options.map(opt => (
                    <Grid item xs={6} key={opt}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={() => handleOptionClick(opt)}
                        disabled={showAnswer && !lastWrong}
                        sx={{ fontSize:'1.2rem', height:60, textTransform:'none' }}
                      >
                        {opt}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {level === 1 && (
              <Box sx={{ textAlign:'center', mb:4 }}>
                <Typography variant="h1" sx={{ fontSize:'3rem', mb:2 }}>
                  {currentKana.romaji.toLowerCase()}
                </Typography>
                <Grid container spacing={2}>
                  {options.map((opt,i) => (
                    <Grid item xs={6} key={i}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={() => handleOptionClick(opt)}
                        disabled={showAnswer && !lastWrong}
                        sx={{
                          fontSize:'2rem',
                          height:60,
                          bgcolor: showAnswer && opt.kana===currentKana.kana
                            ? 'success.light':'inherit'
                        }}
                      >
                        {opt.kana}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {level === 2 && (
              <Box sx={{ textAlign:'center', mb:4 }}>
                <Typography variant="h1" sx={{ fontSize:'4rem', mb:2 }}>
                  {currentKana.kana}
                </Typography>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="請輸入羅馬拼音"
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
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

            {level === 3 && (
              <Box sx={{ textAlign:'center', mb:4 }}>
                <Box sx={{ display:'flex', justifyContent:'center', gap:2, mb:2 }}>
                  {options.map((k,i) => (
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
                    onChange={e => setUserAnswer(e.target.value)}
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

            {showAnswer && lastWrong && (
              <Typography variant="h6" color="error" sx={{ textAlign:'center', mt:2 }}>
                錯誤！正確答案是{' '}
                {level === 0
                  ? currentKana.romaji
                  : level === 1
                    ? currentKana.kana
                    : level === 3
                      ? options.map(k => k.romaji).join('')
                      : currentKana.romaji
                }
              </Typography>
            )}
          </>
        )}

        <Dialog open={showCompletionDialog} onClose={() => setShowCompletionDialog(false)}>
          <DialogTitle>測驗完成！</DialogTitle>
          <DialogContent>
            <Typography>恭喜你完成所有關卡！</Typography>
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
