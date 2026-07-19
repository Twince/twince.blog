import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { rehypeImgToFigure } from './rehypeImgToFigure';

/* raw: true = 본문에 <br> 등 인라인 HTML이 섞인 저작(이 블로그의 상시 패턴) */
const render = async (md: string, raw = false) => {
  const base = unified().use(remarkParse).use(remarkRehype, raw ? { allowDangerousHtml: true } : {});
  const p = raw ? base.use(rehypeRaw) : base;
  return String(await p.use(rehypeImgToFigure).use(rehypeStringify).process(md));
};

describe('나란히 배치 (img-row)', () => {
  it('공동 캡션 없으면 각 이미지의 alt가 셀별 figure/figcaption으로 승격된다', async () => {
    const html = await render('![왼쪽 캡션](a.png) ![오른쪽 캡션](b.png)');
    expect(html).toContain('<div class="img-row">');
    expect(html).toContain('<figcaption id="caption-1">왼쪽 캡션</figcaption>');
    expect(html).toContain('<figcaption id="caption-2">오른쪽 캡션</figcaption>');
  });

  it('다음 줄 텍스트는 공동 캡션이 되고 alt는 대체 텍스트로 보존된다', async () => {
    const html = await render('![왼쪽](a.png) ![오른쪽](b.png)\n공동 캡션.');
    expect(html).toMatch(/<figure[^>]*><div class="img-row">/);
    expect(html).toContain('<figcaption id="caption-1">공동 캡션.</figcaption>');
    expect(html).toContain('alt="왼쪽"');
  });

  it('alt 혼합 행은 alt 있는 셀만 figure로 승격된다', async () => {
    const html = await render('![캡션 있는 쪽](a.png) ![](b.png)');
    expect(html.match(/<figure/g)).toHaveLength(1);
    expect(html).toContain('<img src="b.png" alt="">');
  });

  it('전부 빈 alt인 장식 행은 승격 없이 img-row만 만든다', async () => {
    const html = await render('![](a.png) ![](b.png)');
    expect(html).toContain('img-row');
    expect(html).not.toContain('<figure');
  });
});

describe('단독 이미지', () => {
  it('alt가 캡션으로 승격된다', async () => {
    const html = await render('![단독 캡션](a.png)');
    expect(html).toContain('<figcaption id="caption-1">단독 캡션</figcaption>');
  });

  it('연속 줄 텍스트가 캡션이 되고 alt는 보존된다', async () => {
    const html = await render('![sr 텍스트](a.png)\n연속 줄 캡션.');
    expect(html).toContain('<figcaption id="caption-1">연속 줄 캡션.</figcaption>');
    expect(html).toContain('alt="sr 텍스트"');
  });

  it('빈 alt 장식 이미지는 문단을 건드리지 않는다', async () => {
    expect(await render('![](a.png)')).toBe('<p><img src="a.png" alt=""></p>');
  });

  it('문장 속 인라인 이미지는 변환하지 않는다', async () => {
    const html = await render('앞 텍스트 ![아이콘](i.png) 뒤 텍스트');
    expect(html).toBe('<p>앞 텍스트 <img src="i.png" alt="아이콘"> 뒤 텍스트</p>');
  });
});

describe('힌트 (|폭, |left/|right)', () => {
  it('폭 힌트는 표시 폭만 제한한다', async () => {
    const html = await render('![도면|400](a.png)');
    expect(html).toContain('style="width:min(100%, 400px);height:auto;"');
    expect(html).toContain('alt="도면"');
  });

  it('플로트+폭+alt 캡션이 figure 클래스로 합성된다 (순서 무관)', async () => {
    const left = await render('![도면 캡션|300|left](a.png)\n\n뒤 문단.');
    expect(left).toMatch(/<figure[^>]*class="img-float-left"/);
    expect(left).toContain('width:min(100%, 300px)');
    const right = await render('![sr|right|240](a.png)');
    expect(right).toMatch(/<figure[^>]*class="img-float-right"/);
  });

  it('빈 alt 플로트는 bare img에 클래스만 붙는다', async () => {
    const html = await render('![|left](a.png)');
    expect(html).toContain('<img src="a.png" alt="" class="img-float-left">');
    expect(html).not.toContain('<figure');
  });

  it('row 셀·인라인의 플로트 힌트는 무시되고 data-float가 HTML로 새지 않는다', async () => {
    const row = await render('![a|left](a.png) ![b](b.png)');
    expect(row).not.toContain('img-float');
    expect(row).not.toContain('data-float');
    const inline = await render('앞 ![x|left](i.png) 뒤');
    expect(inline).not.toContain('data-float');
  });
});

describe('회귀 (2026-07-19 코드리뷰)', () => {
  it('<br>뿐인 연속 줄은 캡션이 아니다 — 빈 figcaption 금지, alt 폴백 유지', async () => {
    const html = await render('![대체텍스트](x.png)\n<br>', true);
    expect(html).toContain('<figcaption id="caption-1">대체텍스트</figcaption>');
    expect(html).not.toContain('<figcaption id="caption-1"></figcaption>');
  });

  it('<br>뿐인 연속 줄 + 나란히 배치도 셀별 alt 캡션을 유지한다', async () => {
    const html = await render('![a](a.png) ![b](b.png)\n<br>', true);
    expect(html).toContain('<figcaption id="caption-1">a</figcaption>');
    expect(html).toContain('<figcaption id="caption-2">b</figcaption>');
  });

  it('|한 자리 수로 끝나는 정당한 alt는 힌트로 오인하지 않는다', async () => {
    const html = await render('![성능 비교 1|2](chart.png)');
    expect(html).toContain('alt="성능 비교 1|2"');
    expect(html).not.toContain('style=');
  });

  it('2자리 이상 폭 힌트는 여전히 동작한다', async () => {
    expect(await render('![도면|40](chart.png)')).toContain('width:min(100%, 40px)');
  });

  it('aria-labelledby는 figure에만 — img의 alt가 accname에서 소거되지 않는다', async () => {
    const html = await render('![sr 텍스트](a.png)\n연속 줄 캡션.');
    expect(html).toMatch(/<figure aria-labelledby="caption-1">/);
    expect(html).not.toMatch(/<img[^>]*aria-labelledby/);
  });
});
