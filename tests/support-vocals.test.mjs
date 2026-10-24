import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const cases = [
  ['support/index.html', ['为什么 AI 歌词识别失败？', '纯伴奏', 'Backing Track', 'カラオケ音源', '失败不会消耗 Credit']],
  ['en/support/index.html', ['Why did AI lyric sync fail?', 'audible lead vocals', 'Instrumental', 'karaoke', 'Failed AI tasks do not consume a credit']],
  ['ja/support/index.html', ['AI歌詞同期が失敗するのはなぜですか？', '歌声入り', 'カラオケ音源', '手動タイミング編集', 'クレジットは消費されません']],
];
for (const [path, phrases] of cases) {
  test('support FAQ explains vocal-only AI recognition in '+path, async () => {
    const source = await readFile(new URL('../site-source/static/'+path, import.meta.url),'utf8');
    const compatibility = await readFile(new URL('../'+path, import.meta.url),'utf8');
    assert.equal(source, compatibility, 'branch-root support copy must match canonical source');
    for (const phrase of phrases) assert.ok(source.includes(phrase), path+' missing '+phrase);
  });
}
