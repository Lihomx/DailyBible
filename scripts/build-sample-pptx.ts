import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';

interface SlideSeed {
  slideNumber: number;
  title: string;
  paragraphs: string[];
  isIntroBoilerplate?: boolean;
}

export const SAMPLE_SERMON_SLIDES: SlideSeed[] = [
  {
    slideNumber: 1,
    title: '南橙縣以薩迦靈糧堂 · 我們是',
    paragraphs: ['1 充滿熱愛的教會', '南橙縣以薩迦靈糧堂 我們是'],
    isIntroBoilerplate: true,
  },
  {
    slideNumber: 2,
    title: '南橙縣以薩迦靈糧堂 · 我們是',
    paragraphs: ['2 代代相傳的教會', '南橙縣以薩迦靈糧堂 我們是'],
    isIntroBoilerplate: true,
  },
  {
    slideNumber: 3,
    title: '南橙縣以薩迦靈糧堂 · 我們是',
    paragraphs: ['3 滿有憐憫的教會', '南橙縣以薩迦靈糧堂 我們是'],
    isIntroBoilerplate: true,
  },
  {
    slideNumber: 4,
    title: '南橙縣以薩迦靈糧堂 · 我們是',
    paragraphs: ['4 注重宣教的教會', '南橙縣以薩迦靈糧堂 我們是'],
    isIntroBoilerplate: true,
  },
  {
    slideNumber: 5,
    title: '南橙縣以薩迦靈糧堂',
    paragraphs: [
      '這是一個值得你參與的教會！',
      '這是一個值得你委身的教會！',
      '這就是我們的教會！',
    ],
    isIntroBoilerplate: true,
  },
  {
    slideNumber: 6,
    title: '信心宣言',
    paragraphs: [
      '我信上帝，我信聖經中的每一句話',
      '我願意被聖靈充滿，成為一位具有熱情、活力、健康、神的兒女',
      '我願意活出基督的信仰，成為耶穌的代言人，阿們！',
      '南橙縣以薩迦靈糧堂',
    ],
    isIntroBoilerplate: true,
  },
  {
    slideNumber: 7,
    title: '聖靈的工作：聖靈引導 系列-3 (Works of the Holy Spirit!)',
    paragraphs: [
      '南橙縣以薩迦靈糧堂 · 2024-12-01 主日證道',
      '主題：聖靈的工作 — 聖靈引導（系列-3） Works of the Holy Spirit!',
    ],
  },
  {
    slideNumber: 8,
    title: '■ 主題經節',
    paragraphs: [
      '約翰福音 14:16-17 我要求父、父就另外賜給你們一位保惠師、〔或作訓慰師下同〕叫他永遠與你們同在、17 就是真理的聖靈、乃世人不能接受的．因為不見他、也不認識他．你們卻認識他．因他常與你們同在、也要在你們裡面。',
      'John 14:16-17 And I will ask the Father, and he will give you another Counselor to be with you forever--17 the Spirit of truth. The world cannot accept him, because it neither sees him nor knows him. But you know him, for he lives with you and will be in you.',
      '哥林多後書 3:17 主就是那靈、主的靈在那裡、那裡就得以自由。',
      '2 Corinthians 3:17 Now the Lord is the Spirit, and where the Spirit of the Lord is, there is freedom.',
    ],
  },
  {
    slideNumber: 9,
    title: '■ 一、他是最好的導師 (He is the Teacher.)',
    paragraphs: [
      '約翰福音 14:26a 但保惠師、就是父因我的名所要差來的聖靈、他要將一切的事、指教你們、…',
      'John 14:26a But the Counselor, the Holy Spirit, whom the Father will send in my name, will teach you all things …',
      '以賽亞書 30:20-21 主雖以艱難給你當餅、以困苦給你當水、你的教師卻不再隱藏、你眼必看見你的教師．21 你或向左、或向右、你必聽見後邊有聲音說、這是正路、要行在其間。',
      'Isaiah 30:20-21 Although the Lord gives you the bread of adversity and the water of affliction, your teachers will be hidden no more; with your own eyes you will see them. 21 Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, "This is the way; walk in it."',
    ],
  },
  {
    slideNumber: 10,
    title: '■ 主的恩膏在凡事上教訓我們',
    paragraphs: [
      '約翰一書 2:27 你們從主所受的恩膏、常存在你們心裡、並不用人教訓你們．自有主的恩膏在凡事上教訓你們．這恩膏是真的、不是假的．你們要按這恩膏的教訓、住在主裡面。',
      '1 John 2:27 As for you, the anointing you received from him remains in you, and you do not need anyone to teach you. But as his anointing teaches you about all things and as that anointing is real, not counterfeit--just as it has taught you, remain in him.',
    ],
  },
  {
    slideNumber: 11,
    title: '■ 二、他是最好的提醒者 (He is the Remembrance.)',
    paragraphs: [
      '約翰福音 14:26b … 並且要叫你們想起我對你們所說的一切話。',
      'John 14:26b … and will remind you of everything I have said to you.',
      '馬可福音 14:72 立時雞叫了第二遍．彼得想起耶穌對他所說的話、雞叫兩遍以先、你要三次不認我。思想起來、就哭了。',
      'Mark 14:72 Immediately the rooster crowed the second time. Then Peter remembered the word Jesus had spoken to him: "Before the rooster crows twice you will disown me three times." And he broke down and wept.',
    ],
  },
  {
    slideNumber: 12,
    title: '■ 聖靈澆灌與異象',
    paragraphs: [
      '使徒行傳 2:14-17 彼得和十一個使徒、站起、高聲說、猶太人、和一切住在耶路撒冷的人哪、這件事你們當知道、也當側耳聽我的話。15 你們想這些人是醉了、其實不是醉了、因為時候剛到巳初．16 這正是先知約珥所說的．17 『　神說、在末後的日子、我要將我的靈澆灌凡有血氣的．你們的兒女要說豫言．你們的少年人要見異象．老年人要作異夢．',
      '(Wedding Ceremony)',
    ],
  },
  {
    slideNumber: 13,
    title: '■ 三、他是最好的引導 (He is the Guide.)',
    paragraphs: [
      '約翰福音 16:13a 只等真理的聖靈來了、他要引導你們明白〔原文作進入〕一切的真理．…',
      'John 16:13a But when he, the Spirit of truth, comes, he will guide you into all truth. …',
      '創世記 24:26-27 那人就低頭向耶和華下拜、27 說、耶和華我主人亞伯拉罕的　神是應當稱頌的、因他不斷的以慈愛誠實待我主人．至於我、耶和華在路上引領我、直走到我主人的兄弟家裡。',
      '... As for me, the LORD has led me on the journey to the house of my master\'s relatives."',
      '羅馬書 8:14 因為凡被　神的靈引導的、都是　神的兒子。',
      'Romans 8:14 because those who are led by the Spirit of God are sons of God.',
    ],
  },
  {
    slideNumber: 14,
    title: '■ 四、他是最好的啟示者 (He is the Revelator.)',
    paragraphs: [
      '約翰福音 16:13b … 因為他不是憑自己說的、乃是把他所聽見的都說出來．並要把將來的事告訴你們。',
      'John 16:13b … He will not speak on his own; he will speak only what he hears, and he will tell you what is yet to come.',
      '希伯來書 11:7 挪亞因著信、既蒙　神指示他未見的事、動了敬畏的心、豫備了一隻方舟、使他全家得救．因此就定了那世代的罪、自己也承受了那從信而來的義。',
      'Hebrews 11:7 By faith Noah, when warned about things not yet seen, in holy fear built an ark to save his family. By his faith he condemned the world and became heir of the righteousness that comes by faith.',
    ],
  },
  {
    slideNumber: 15,
    title: '■ 五、他是所有資源的管理者 (He is the Administrator of all wealth.)',
    paragraphs: [
      '以弗所書 1:13-14 你們既聽見真理的道、就是那叫你們得救的福音、也信了基督、既然信他、就受了所應許的聖靈為印記．14 這聖靈、是我們得基業的憑據、直等到　神之民被贖、使他的榮耀得著稱讚。',
      '以弗所書 4:8 所以經上說、『他升上高天的時候、擄掠了仇敵、將各樣的恩賜賞給人。』',
      'Ephesians 4:8 This is why it says: "When he ascended on high, he led captives in his train and gave gifts to men."',
      '哥林多前書 12:4 恩賜原有分別、聖靈卻是一位。',
      '1 Corinthians 12:4 There are different kinds of gifts, but the same Spirit.',
    ],
  },
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSlideXml(slide: SlideSeed): string {
  const bodyParas = slide.paragraphs
    .map(
      (p) => `
          <a:p>
            <a:r>
              <a:rPr lang="zh-TW" sz="2000"/>
              <a:t>${escapeXml(p)}</a:t>
            </a:r>
          </a:p>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
       xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
       xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="2" name="Title 1"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph type="title"/></p:nvPr>
        </p:nvSpPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="zh-TW" sz="3200" b="1"/>
              <a:t>${escapeXml(slide.title)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="3" name="Content Placeholder 2"/>
          <p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>
          <p:nvPr><p:ph idx="1"/></p:nvPr>
        </p:nvSpPr>
        <p:txBody>
          <a:bodyPr/>
          <a:lstStyle/>${bodyParas}
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;
}

async function generateSamplePptx() {
  console.log('\n=== Generating Sample Sermon PPTX ===');
  const zip = new JSZip();

  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${SAMPLE_SERMON_SLIDES.map(
    (s) =>
      `<Override PartName="/ppt/slides/slide${s.slideNumber}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`
  ).join('\n  ')}
</Types>`
  );

  zip.file(
    'ppt/presentation.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
                xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>
    ${SAMPLE_SERMON_SLIDES.map(
      (s) => `<p:sldId id="${255 + s.slideNumber}" r:id="rId${s.slideNumber}"/>`
    ).join('\n    ')}
  </p:sldIdLst>
</p:presentation>`
  );

  for (const slide of SAMPLE_SERMON_SLIDES) {
    zip.file(`ppt/slides/slide${slide.slideNumber}.xml`, buildSlideXml(slide));
  }

  const outDir = path.resolve(process.cwd(), 'public', 'samples');
  fs.mkdirSync(outDir, { recursive: true });
  const pptxPath = path.join(outDir, '2024-12-01-works-of-the-holy-spirit.pptx');
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  fs.writeFileSync(pptxPath, buf);
  console.log(`✓ Saved sample PPTX to ${pptxPath}`);
}

generateSamplePptx().catch((err) => {
  console.error(err);
  process.exit(1);
});
