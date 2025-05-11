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
  // 1. currentKana 改為包含 hira/kata/romaji
  const [currentKana, setCurrentKana] = useState({ hira: '', kata: '', romaji: '' });
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [showTypeSelector, setShowTypeSelector] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [lastWrong, setLastWrong] = useState(false);
  const [options, setOptions] = useState([]);
  const [lastKanas, setLastKanas] = useState([]);

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

  // 2. 完整替換 generateNewQuestion
  const generateNewQuestion = () => {
    // 重置狀態
    setUserAnswer('');
    setShowAnswer(false);
    setLastWrong(false);

    // 蒐集所有已選組別的假名，並去除重複羅馬拼音
    const allKana = selectedGroups.flatMap(g => g.items);
    const uniqueRomaji = Array.from(new Set(allKana.map(k => k.romaji)));
    if (uniqueRomaji.length === 0) return;

    // 隨機挑一個羅馬拼音作為正解
    const correctRomaji = uniqueRomaji[
      Math.floor(Math.random() * uniqueRomaji.length)
    ];

    // 找出對應的平假名／片假名（若有）
    const hiraChar = allKana.find(k =>
      k.romaji === correctRomaji &&
      selectedGroups.some(g => g.type === 'hiragana' && g.items.includes(k))
    )?.kana || '';
    const kataChar = allKana.find(k =>
      k.romaji === correctRomaji &&
      selectedGroups.some(g => g.type === 'katakana' && g.items.includes(k))
    )?.kana || '';

    // 設定目前題目
    setCurrentKana({ hira: hiraChar, kata: kataChar, romaji: correctRomaji });

    // 產生三個干擾選項（排除正解），再加上正解並亂序
    const distractors = uniqueRomaji.filter(r => r !== correctRomaji);
    const shuffled = distractors.sort(() => Math.random() - 0.5).slice(0, 3);
    setOptions([...shuffled, correctRomaji].sort(() => Math.random() - 0.5));
  };

  const handleStartQuiz = () => {
    if (selectedGroups.length === 0) {
      setError('請至少選擇一組五十音');
      return;
    }
    setError('');
    setShowTypeSelector(false);
    setLevel(0);
    setScore(0);
    setTotal(0);
    setWrongCount(0);
    generateNewQuestion();
  };

  const handleRestart = () => {
    setScore(0);
    setTotal(0);
    setLevel(0);
    setShowCompletionDialog(false);
    setShowTypeSelector(true);
    setSelectedGroups([]);
  };

  // 3. 修改 handleOptionClick，第一關接受字串，其餘保持原邏輯
  const handleOptionClick = (opt) => {
    if (showAnswer && !lastWrong) return;

    if (level === 0) {
      // opt 是羅馬拼音字串
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
      return;
    }

    // 第二關：選五十音
    if (level === 1) {
      const correct = currentKana.kana;
      if (opt.kana === correct) {
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
      return;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (level === 2 && !currentKana) return;

    if (level === 2) {
      const isCorrect = userAnswer.toLowerCase() === currentKana.romaji;
      if (isCorrect) {
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
      const correctAnswer = options.map(k => k.romaji).join('');
      const isCorrect = userAnswer.replace(/\s+/g, '').toLowerCase() === correctAnswer;
      if (isCorrect) {
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

  const nextQuestion = (nextScore = score, forceNext = false) => {
    setShowAnswer(false);
    setUserAnswer('');
    setLastWrong(false);

    if (!forceNext && nextScore >= LEVELS[level].need) {
      if (level < 3) {
        setLevel(level + 1);
      } else {
        setShowCompletionDialog(true);
      }
      return;
    }
    generateNewQuestion();
  };

  const renderGroupSelector = () => {
    const types = ['hiragana', 'katakana'];
    const typeLabels = {
      hiragana: '平假名 (ひらがな)',
      katakana: '片假名 (カタカナ)'
    };
    const basicRows = ['あ行', 'か行', 'さ行', 'た行', 'な行', 'は行', 'ま行', 'や行', 'ら行', 'わ行'];
    const dakuonRows = ['が行', 'ざ行', 'だ行', 'ば行'];
    const handakuonRows = ['ぱ行'];
    const katakanaBasicRows = ['ア行', 'カ行', 'サ行', 'タ行', 'ナ行', 'ハ行', 'マ行', 'ヤ行', 'ラ行', 'ワ行'];
    const katakanaDakuonRows = ['ガ行', 'ザ行', 'ダ行', 'バ行'];
    const katakanaHandakuonRows = ['パ行'];

    const renderSection = (type, rows, title) => (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', borderBottom: '2px solid', pb: 1 }}>
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
                    p: 2,
                    cursor: 'pointer',
                    bgcolor: isSelected ? 'primary.light' : 'background.paper',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.light' : 'action.hover'
                    }
                  }}
                  onClick={() => handleGroupToggle(type, row)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
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

    return (
      <Box sx={{ mt: 2 }}>
        {types.map(type => (
          <Box key={type} sx={{ mb: 6 }}>
            <Typography variant="h5" sx={{ mb: 3, color: 'primary.dark', fontWeight: 'bold' }}>
              {typeLabels[type]}
            </Typography>
            {renderSection(type, type === 'hiragana' ? basicRows : katakanaBasicRows, '基本音')}
            {renderSection(type, type === 'hiragana' ? dakuonRows : katakanaDakuonRows, '濁音')}
            {renderSection(type, type === 'hiragana' ? handakuonRows : katakanaHandakuonRows, '半濁音')}
          </Box>
        ))}
      </Box>
    );
  };

  useEffect(() => {
    if (!showTypeSelector) {
      setScore(0);
      generateNewQuestion();
    }
    // eslint-disable-next-line
  }, [level]);

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>五十音測驗</Typography>
          {!showTypeSelector && (
            <>
              <Typography variant="h5" color="primary" gutterBottom>{LEVELS[level].name}</Typography>
              <Typography variant="h6" gutterBottom>
                分數: {score} / {LEVELS[level].need} (目標: {LEVELS[level].need}題)
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">錯誤題數: {wrongCount}</Typography>
              <Typography variant="subtitle2" color="primary">
                已選擇 {selectedGroups.length} 組五十音
              </Typography>
            </>
          )}
        </Box>

        {showTypeSelector ? (
          <Box>
            <Typography variant="h6" gutterBottom>請選擇要練習的五十音組別（至少選擇一組）：</Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {renderGroupSelector()}
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleStartQuiz}
                disabled={selectedGroups.length === 0}
              >
                開始測驗
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* 第一關：選羅馬拼音 */}
            {level === 0 && (
              <>
                <Typography
                  variant="h1"
                  component="div"
                  sx={{
                    fontSize: '4rem',
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 4
                  }}
                >
                  {currentKana.hira} {currentKana.kata}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {options.map(opt => (
                    <Grid item xs={6} key={opt}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={() => handleOptionClick(opt)}
                        disabled={showAnswer && !lastWrong}
                        sx={{
                          fontSize: '1.2rem',
                          height: '60px',
                          textTransform: 'none'
                        }}
                      >
                        {opt}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* 第二關：選五十音 */}
            {level === 1 && (
              <>
                <Typography variant="h1" component="div" sx={{ fontSize: '3rem', mb: 2 }}>
                  {currentKana.romaji.toLowerCase()}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {options.map((option, idx) => (
                    <Grid item xs={6} key={idx}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="large"
                        onClick={() => handleOptionClick(option)}
                        disabled={showAnswer && !lastWrong}
                        sx={{
                          fontSize: '2rem',
                          height: '60px',
                          bgcolor: showAnswer && option.kana === currentKana.kana ? 'success.light' : 'inherit'
                        }}
                      >
                        {option.kana}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* 第三關 & 第四關 保持原狀 */}
            {level === 2 && (
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h1" component="div" sx={{ fontSize: '4rem', mb: 2 }}>
                  {currentKana.kana}
                </Typography>
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="請輸入羅馬拼音"
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    sx={{ mb: 2 }}
                    disabled={showAnswer && lastWrong}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
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
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                {options.length === 3 ? (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                      {options.map((kana, i) => (
                        <Typography key={i} variant="h1" component="div" sx={{ fontSize: '4rem' }}>
                          {kana.kana}
                        </Typography>
                      ))}
                    </Box>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      請連續輸入這三個五十音的羅馬拼音（不用空格）
                    </Typography>
                    <form onSubmit={handleSubmit}>
                      <TextField
                        fullWidth
                        label="例如：aue"
                        value={userAnswer}
                        onChange={e => setUserAnswer(e.target.value)}
                        sx={{ mb: 2 }}
                        disabled={showAnswer && lastWrong}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        disabled={showAnswer && lastWrong}
                      >
                        提交
                      </Button>
                    </form>
                  </>
                ) : (
                  <Typography color="error" sx={{ mt: 4 }}>
                    題庫不足，請至少選擇一組有三個以上五十音的組別！
                  </Typography>
                )}
              </Box>
            )}

            {showAnswer && lastWrong && (
              <Typography
                variant="h6"
                sx={{
                  textAlign: 'center',
                  color: 'error.main',
                  mt: 2
                }}
              >
                錯誤！正確答案是 {
                  level === 0 ? currentKana.romaji.toLowerCase() :
                  level === 1 ? currentKana.kana :
                  options.map(k => k.romaji.toLowerCase()).join(' ')
                }
              </Typography>
            )}
          </>
        )}

        <Dialog open={showCompletionDialog} onClose={() => setShowCompletionDialog(false)}>
          <DialogTitle>測驗完成！</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>恭喜您完成所有關卡！</Typography>
            <Typography variant="body1" gutterBottom>
              已選擇的組別：{selectedGroups.map(g => g.name).join('、')}
            </Typography>
            <Typography variant="body1" gutterBottom>總錯誤題數：{wrongCount}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleRestart} color="primary" variant="contained">重新開始</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default KanaQuiz;
