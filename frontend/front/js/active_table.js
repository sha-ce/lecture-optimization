///////////
// 時間割 //
///////////
let tc_el = document.getElementById('table-columns'); // [var] 曜日をいれるエレメント
let days = ['', '月', '火', '水', '木', '金']           // [var] 曜日
for (let day of days) {                               // [process] 曜日を追加
    tc_el.insertAdjacentHTML("beforeend", `<th class="table-top">${day}</th>`);
}
let tb_el = document.getElementById('table-body');           // [var] テーブルの曜日以外部分のエレメント
let course_times = ['1限', '2限', '3限', '4限', '5限', '6限']; // [var] 時限
let days_en = ['mon', 'tue', 'wed', 'thu', 'fri'];           // [var] 曜日英語
for (let time of course_times) {                             // [process] 各行に関して、時限・各曜日のセルを追加する処理
    let incode = `<tr><td class="rows">${time}</td>`;
    for (let day of days_en) { incode += `<td><div id="${day}-${time[0]}" class="cell"><button onclick="popup(this)">+</button></div></td>`; }
    tb_el.insertAdjacentHTML('beforeend', `${incode}</tr>`);
}
let loader_el = document.getElementById('loader'); // (←element, ↓追加コード) backから受け取るまでの間のローディングを表示するHTMLコード
for (let i=1; i<=12; i++) { loader_el.insertAdjacentHTML("beforeend", `<div class="sk-circle${i} sk-circle"></div>`); }
function optimize() {
    loading();                                     // [process] table.htmlが読み込まれた時にゲットするまっでローディングアニメーションを表示
    new Promise((resolve, reject) => {             // [process] 10msの後、ローカルストレージのデータをget()によりbackに送信し講義情報を受け取る
        setTimeout(() => {resolve(); }, 10);       // リロード直後にget()するとlocalstrageアクセスが競合してうまくいかないので10ms遅延させる
    }).then(() => {
        let mustSelectClasses = localStorage.getItem('must_select_classes');
        if (mustSelectClasses) {
            // パースしてから再度stringのリストに戻す
            mustSelectClasses = mustSelectClasses.split(',');
            console.log(mustSelectClasses);
        } else {
            mustSelectClasses = []; // もしも存在しなければ空リスト
        }
        let data = {
            compulsory: localStorage.getItem('compulsory'),
            quarter: localStorage.getItem('quarter').replace('Q', ''),
            special: localStorage.getItem('special'),
            social: localStorage.getItem('social'),
            alphas: localStorage.getItem('alphas').split(',').map(Number),
            l_early: localStorage.getItem('l_early'),
            units: localStorage.getItem('units').split(',').map(Number),
            keywords: localStorage.getItem('keywords'),
            must_select_classes: mustSelectClasses.join(","),
        }
        get(data); // defined in script.js
    });
}
optimize();

///////////////
// your info //
///////////////
setInfo();
function setInfo() { // [func] localstrageから情報を取ってきてyour info に表示
    let selected_conditions = document.getElementById('your-info');
    while(selected_conditions.firstChild){ selected_conditions.removeChild( selected_conditions.firstChild ); }

    let units = localStorage.getItem('units').split(',').map(Number);
    let a = localStorage.getItem('alphas').split(',').map(Number);
    let astr = '';
    s =  [
        ['授業日数 ', 'どうでもいい', '多め', '少なめ'],
        ['課題の量 ', 'どうでもいい', '多め', '少なめ'],
        ['単位数 ', 'どうでもいい', '多め', '少なめ'],
        ['対面か遠隔 ', 'どっちでもいい', '→ 対面', '→ 遠隔'],
        ['興味関心 ', '考慮しない', '無視する', '優先する'],
        ['朝は ', '弱くも強くもない', '強い', '弱い'],
        ['試験 ', '考慮しない', '大好き', '大嫌い'],
    ];
    for (let i=0; i<s.length; i++) { astr += `<p>${s[i][0]} ` + ((a[i]==0)?`${s[i][1]}（${a[i]}）`:(a[i]<0)?`${s[i][2]}（${-a[i]}）`:`${s[i][3]}（${a[i]}）`)+`</p>`; }

    let conditions_code = `
        <h3>Course</h3>
        <p>分野　　　　　　　　: ${localStorage.getItem('compulsory')}</p>
        <p>専門深化プログラム　: ${localStorage.getItem('special')}</p>
        <p>社会駆動プログラム　: ${localStorage.getItem('social')}</p>
        <p>クオーター　　　　　: ${localStorage.getItem('quarter')}</p>
        <h3>Conditions</h3>${astr}
        <p>授業は ${localStorage.getItem('l_early')}限以降に入れたい</p>
        <p>単位数 ${units[0]} 単位以上, ${units[1]} 単位以下</p>
        <h3>Keywords</h3>
        <p>${localStorage.getItem('keywords')}</p>
        <div class="button-wrapper">
        <button type="submit" id="submit" class="submit" onclick="window.location.assign('../../index.html');">条件調整</button>
        </div>
    `;
    selected_conditions.insertAdjacentHTML("beforeend", conditions_code);
}
// [process] クリックで表示・非表示を切り替える
document.getElementById('your-info').style.display = 'none';
document.getElementById('selected-conditions').setAttribute('onclick', 'openCloseInfo()');
function openCloseInfo() {
    let estyle = document.getElementById('your-info').style;
    if (estyle == null || estyle.display == 'none') { document.getElementById('your-info').style.display='block'; }
    else { document.getElementById('your-info').style.display = 'none'; }
}
function setUnitNum() { // [function] 単位数を表示
    let sum_units = 0;
    let classes = JSON.parse(localStorage.getItem('table'));
    for (let [_,c] of Object.entries(classes)) { sum_units +=c.numofunits; }
    document.getElementById('units-sum').value = sum_units;
}