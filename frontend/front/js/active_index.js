
//////////////////////
// コース選択スクリプト //
//////////////////////
let select_el = document.getElementById('select'); // [vars] コース選択の親エレメント
let selections = {                                 // [vars] 各コースに対する選択候補
    'compulsory': {'分野': ['知能情報', '情報・通信', '知的システム', '物理情報', '生命科学情報']},
    'special'   : {'専門深化プログラム': ['データ科学コース', '人工知能コース', 'メディア情報学コース', 'ソフトウェアデザインコース', '情報通信ネットワークコース', 'コンピュータ工学コース', 'ロボティクスコース', 'システム制御コース', '先進機械コース', '電子物理コース', '生物物理コース', '分子生命工学コース', '医用生命工学コース']},
    'social'    : {'社会駆動プログラム': ['AI応用コース', '金融流通コース', 'ソフトウェア開発プロセスコース', '画像認識コース', 'ロボティクスシンセシス導入コース', '計算力学エンジニアコース', '大規模計算科学：基礎と実践コース', 'アントレプレナーシップコース', '情報教育支援コース', '生命体工学コース', '国際エンジニアリング共同講義コース', '需要創発コース', 'マイクロ化技術実践コース', '情報工学導入コース']},
    'quarter'   : {'クオーター': ['Q1', 'Q2', 'Q3', 'Q4']},
}
for (let k in selections) {                        // [process] 各コースのセレクトタグを追加
    kjp = Object.keys(selections[k])[0];
    select_el.insertAdjacentHTML("beforeend", `<select id="${k}"><option value="default">${kjp}</option></select>`);
    addSelectOption(k, selections[k][kjp]);
}
function addSelectOption(id, options) {            // [func] 任意のコースに対する内部のオプションタグの追加
    let e = document.getElementById(id);
    for (let option of options) { e.insertAdjacentHTML("beforeend", `<option value="${option}">${option}</option>`); }
    if(localStorage.hasOwnProperty(id)) { e.value = localStorage.getItem(id); }
}

///////////////////////
// 条件選択用スクリプト //
///////////////////////
let question_el = document.getElementById('questions'); // [vars] 条件選択の親エレメント
let questions = [                                       // [vars] 各条件の質問と選択
    {title: '授業日数は', labels: ['多い方がいい', '少ない方がいい']},
    {title: '課題の量は', labels: ['多い方がいい', 'ない方がいい']},
    {title: '履修単位数はできるだけ', labels: ['多めで', '少なめで']},
    {title: '対面 or 遠隔', labels: ['対面が好き', '遠隔が好き']},
    {title: '講義を選択する時、自分の興味関心を', labels:['無視する', '優先する']},
    {title: '早朝の授業はなるべく', labels: ['多く受けたい', '受けたくない']},
    {title: '試験のある授業は', labels: ['大好き', '大嫌い']},
]
const alphas = (localStorage.hasOwnProperty('alphas')) ? localStorage.getItem('alphas').split(',').map(Number) : null; // [vars] localstrageに格納されているalphasの値
for (let i=0; i<questions.length; i++) {                // [process] 各条件に対して選択肢サークルを挿入する
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
    // alphasがnullでない場合にのみチェックを設定
    if (alphas && alphas[i] != undefined) { 
        const alphaElement = document.getElementById(`q${i}-${alphas[i]}`);
        if (alphaElement) { alphaElement.checked = true; }
    }
}
// [process] l-early のinput処理
let le_el = document.getElementById('lecture-early');  // [var] l-earlyのインプットエレメント
let le_slider_el = document.getElementById('slider1'); // [var] l-earlyのスライダーエレメント
let times = ['', '08:50(1限〜)', '10:30(2限〜)', '13:00(3限〜)', '14:40(4限〜)', '16:20(5限〜)']
for (let i=1; i<times.length; i++) { le_el.insertAdjacentHTML("beforeend", `<option value="${i}">${times[i]}</option>`); }
let le_def = (localStorage.hasOwnProperty('l_early')) ? Number(localStorage.getItem('l_early')) : 1;
le_el.value = le_def;
le_slider_el.value = le_def;
function updateValueFromSlider(id, value) { document.getElementById(id).value = value; }; // [func] sliderが更新された時にinputを更新する関数
function updateValueFromInput(id, value) { document.getElementById(id).value = value; };  // [func] inputが更新された時にsliderを更新する関数
// [process] min-max units のinput処理
const range = document.getElementById('range');    // [var] ダブルトグルスライダーのエレメント
const num2 = document.getElementById('min-units'); // [var] 最小値を格納するinput(read=only)のエレメント
const num3 = document.getElementById('max-units'); // [var] 最大値を格納するinput(read=only)のエレメント
if (localStorage.hasOwnProperty('units')) {        // [process] 初期値設定 localstrageに格納されている時の処理
    let units_def = localStorage.getItem('units').split(',').map(Number);
    num2.value = units_def[0];
    num3.value = units_def[1];
}
noUiSlider.create(range, {                         // [process] ダブルトグルスライダー(noUiSlider:外部jsのやつ)の初期設定
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


////////////////////////////
// キーワード選択用スクリプト //
////////////////////////////
let el_key = document.getElementById('keywords'); // [var] キーワード選択の親エレメント
var keywords = [                                  // [var] キーワード
    '科学技術日本語', '英語', '初等整数論', '群論', '可換環論', 
    '有限体論', 'RSA暗号', '楕円曲線号', '機械学習', '深層学習',
    '最適化', 'ソルバー',
];
let selected_keywords = [];                       // [var] localstrageのキーワードを格納する
if (localStorage.hasOwnProperty('keywords')) {    // [process] localstrage内のchekedキーワードを調べるための処理
    let ks = localStorage.getItem('keywords').split(', ');
    for (let k of ks) { selected_keywords[k] = ''; }
}
for (let i=0; i<keywords.length; i++) {           // [process] キーワードを挿入するHTMLコード
    let cheked =  (keywords[i] in selected_keywords) ? 'checked' : '';
    let incode = `<input type="checkbox" id="key${i}" value="${keywords[i]}" ${cheked}><label for="key${i}">${keywords[i]}</label>`;
    el_key.insertAdjacentHTML("beforeend", incode);
}

///////////////////////////////
// 必須選択クラス用スクリプト //
///////////////////////////////
let must_select_classes = [];
if (localStorage.hasOwnProperty('must_select_classes')) {
    try {
        const storedClasses = localStorage.getItem('must_select_classes');
        must_select_classes = storedClasses ? JSON.parse(storedClasses) : [];
        localStorage.setItem('must_select_classes', JSON.stringify(must_select_classes));
    } catch (e) {
        console.error("Failed to parse must_select_classes from localStorage:", e);
        must_select_classes = [];
    }
} else {
    console.log(localStorage.hasOwnProperty('must_select_classes'))
    localStorage.setItem('must_select_classes', JSON.stringify(must_select_classes)); // 初回実行時は空のリストを保存
}

/////////////////////////////////
// 成績通知書アップロードスクリプト //
/////////////////////////////////
const dropZone = document.getElementById("drop-zone");       // [var] ドラッグドロップゾーンのエレメント
const fileInput = document.getElementById("pdf-input");      // [var] inputタグのエレメント
const preview = document.getElementById("preview");          // [var] アップロードされたpdfをプレビューする空間のエレメント
fileInput.addEventListener("change", handleFileSelect);      // [process] ファイルが選択されたときの処理
dropZone.addEventListener("click", () => fileInput.click()); // [process] ドラッグ＆ドロップのイベントリスナー
dropZone.addEventListener("dragover", (event) => {event.preventDefault(); dropZone.classList.add("dragover"); });
dropZone.addEventListener("dragleave", () => { dropZone.classList.remove("dragover"); });
dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    const files = event.dataTransfer.files;
    if (files.length > 0) { handleFileSelect({ target: { files } }); }
});
function handleFileSelect(event) {                           // [func] ファイルが選択/ドロップされたときの処理関数
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") { readPDF(file); }
}
function readPDF(file) {                                     // [func] PDFファイルの読み込み関数
    const reader = new FileReader();
    reader.onload = () => {
        const pdfData = reader.result;
        console.log("PDFのデータが読み込まれました。");

        const iframe = document.createElement("iframe");     // [process] プレビューの表示
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