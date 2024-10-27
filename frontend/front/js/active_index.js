
// コース選択スクリプト
function addSelectOption(id, options) {
    let e = document.getElementById(id);
    for (let option of options) { e.insertAdjacentHTML("beforeend", `<option value="${option}">${option}</option>`); }
    if(localStorage.hasOwnProperty(id)) {
        e.value = localStorage.getItem(id);
    }
}
addSelectOption('compulsory', ['知能情報工学科', '情報通信工学科', '知的システム工学科', '物理情報工学科', '生命科学情報工学科']);
// addSelectOption('grade', ['M1', 'M2', 'D1', 'D2', 'D3']);
document.getElementById('grade').style.display = 'none';
addSelectOption('quarter', ['Q1', 'Q2', 'Q3', 'Q4']);
addSelectOption('special', [
    'データ科学コース', '人工知能コース', 'メディア情報学コース', 'ソフトウェアデザインコース', '情報通信ネットワークコース', 'コンピュータ工学コース',
    'ロボティクスコース', 'システム制御コース', '先進機械コース', '電子物理コース', '生物物理コース', '分子生命工学コース', '医用生命工学コース',
]);
addSelectOption('social', [
    'AI応用コース', '金融流通コース', 'ソフトウェア開発プロセスコース', '画像認識コース', 'ロボティクスシンセシス導入コース', '計算力学エンジニアコース', '大規模計算科学：基礎と実践コース',
    'アントレプレナーシップコース', '情報教育支援コース', '生命体工学コース', '国際エンジニアリング共同講義コース', '需要創発コース', 'マイクロ化技術実践コース', '情報工学導入コース',
]);



// 条件選択用スクリプト
let question_el = document.getElementById('questions');
let questions = [
    {title: '授業日数は', labels: ['多い方がいい', '少ない方がいい']},
    {title: '課題の量は', labels: ['多い方がいい', 'ない方がいい']},
    {title: '履修単位数はできるだけ', labels: ['多めで', '少なめで']},
    {title: '遠隔 or 対面', labels: ['遠隔が好き', '対面が好き']},
    {title: '講義を選択する時、自分の興味関心を', labels:['無視する', '優先する']},
    {title: '早朝の授業はなるべく', labels: ['多く受けたい', '受けたくない']},
    {title: '試験のある授業は', labels: ['大好き', '大嫌い']},
]
for (let i=0; i<questions.length; i++) {
    let incode = `
        <div class="question"><label class="label">${questions[i].title}</label>
        <div class="rating-group" data-name="friends"><div class="radios">
        <span class="label-left res-pc">${questions[i].labels[0]}</span>
    `;
    for (let s=-5; s<=5; s++) { incode += `
        <input type="radio" id="q${i}-${s}" name="q${i}" value="${s}"${(s==0) ? ' checked': ''}>
        <label for="q${i}-${s}" class="circle-${(s<0) ? 'left': (s>0) ? 'right': 'center'} circle-${Math.abs(s)}">
        <i class="fa-solid fa-check check-mark"></i></label>
    `};
    incode += `
        <span class="label-right res-pc">${questions[i].labels[1]}</span></div><div class="labels">
        <span class="label-left res-phone">${questions[i].labels[0]}</span>
        <span class="label-right res-phone">${questions[i].labels[1]}</span></div></div></div>
    `;
    question_el.insertAdjacentHTML("beforeend", incode);
}

let le_el = document.getElementById('lecture-early');
let times = ['', '08:50(1限〜)', '10:30(2限〜)', '13:00(3限〜)', '14:40(4限〜)', '16:20(5限〜)']
for (let i=1; i<times.length; i++) { le_el.insertAdjacentHTML("beforeend", `<option value="${i}">${times[i]}</option>`); }

function updateValueFromSlider(id, value) { document.getElementById(id).value = value; };
function updateValueFromInput(id, value) { document.getElementById(id).value = value; };

const range = document.getElementById('range');
const num2 = document.getElementById('min-units');
const num3 = document.getElementById('max-units');
noUiSlider.create(range, {
    range: {'min': 0, 'max': 30},
    step: 1,
    start: [num2.value, num3.value],
    connect: true,
    behaviour: 'tap-drag',
    tooltips: false,
    pips: {mode: 'steps', stepped: true, density: 10}
});
range.noUiSlider.on('update', function( values, handle ) {
    num2.value = Math.trunc(values[0]);
    num3.value = Math.trunc(values[1]);
});


// キーワード選択用スクリプト
let el_key = document.getElementById('keywords');
var keywords = [
    '科学技術日本語', '英語', '初等整数論', '群論', '可換環論', 
    '有限体論', 'RSA暗号', '楕円曲線号', '機械学習', '深層学習',
    '最適化', 'ソルバー',
];
for (let i=0; i<keywords.length; i++) {
    let incode = `<input type="checkbox" id="key${i}" value="${keywords[i]}"><label for="key${i}">${keywords[i]}</label>`;
    el_key.insertAdjacentHTML("beforeend", incode);
}
