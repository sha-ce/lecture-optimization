
// コース選択スクリプト
let selections = {
    'compulsory': {'分野': ['知能情報', '情報・通信', '知的システム', '物理情報', '生命科学情報']},
    // 'grade'     : {'学年': ['M1', 'M2', 'D1', 'D2', 'D3']},
    'special'   : {'専門深化プログラム': [
                    'データ科学コース', '人工知能コース', 'メディア情報学コース', 'ソフトウェアデザインコース', '情報通信ネットワークコース', 'コンピュータ工学コース',
                    'ロボティクスコース', 'システム制御コース', '先進機械コース', '電子物理コース', '生物物理コース', '分子生命工学コース', '医用生命工学コース']},
    'social'    : {'社会駆動プログラム': [
                    'AI応用コース', '金融流通コース', 'ソフトウェア開発プロセスコース', '画像認識コース', 'ロボティクスシンセシス導入コース', '計算力学エンジニアコース', '大規模計算科学：基礎と実践コース',
                    'アントレプレナーシップコース', '情報教育支援コース', '生命体工学コース', '国際エンジニアリング共同講義コース', '需要創発コース', 'マイクロ化技術実践コース', '情報工学導入コース']},
    'quarter'   : {'クオーター': ['Q1', 'Q2', 'Q3', 'Q4']},
}
let select_el = document.getElementById('select');
for (let k in selections) {
    kjp = Object.keys(selections[k])[0];
    select_el.insertAdjacentHTML("beforeend", `<select id="${k}"><option value="default">${kjp}</option></select>`);
    addSelectOption(k, selections[k][kjp]);
}
function addSelectOption(id, options) {
    let e = document.getElementById(id);
    for (let option of options) { e.insertAdjacentHTML("beforeend", `<option value="${option}">${option}</option>`); }
    if(localStorage.hasOwnProperty(id)) { e.value = localStorage.getItem(id); }
}



// 条件選択用スクリプト
let question_el = document.getElementById('questions');
let questions = [
    {title: '授業日数は', labels: ['多い方がいい', '少ない方がいい']},
    {title: '課題の量は', labels: ['多い方がいい', 'ない方がいい']},
    {title: '履修単位数はできるだけ', labels: ['多めで', '少なめで']},
    {title: '対面 or 遠隔', labels: ['対面が好き', '遠隔が好き']},
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

// pdf file upload form
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("pdf-input");
const preview = document.getElementById("preview");

// ファイルが選択されたときの処理
fileInput.addEventListener("change", handleFileSelect);

// ドラッグ＆ドロップのイベントリスナー
dropZone.addEventListener("click", () => fileInput.click());
dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
});
dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
});
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelect({ target: { files } });
    }
});

// ファイルが選択/ドロップされたときの処理関数
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") { readPDF(file); }
}

// PDFファイルの読み込み関数
function readPDF(file) {
    const reader = new FileReader();
    reader.onload = () => {
        const pdfData = reader.result;
        console.log("PDFのデータが読み込まれました。");

        // プレビューの表示
        const iframe = document.createElement("iframe");
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.src = pdfData;

        dropZone.querySelector('p').textContent = '';
        preview.style.display = 'block';

        preview.innerHTML = "";
        preview.appendChild(iframe);
    };
    reader.readAsDataURL(file);
}