///////////////////////////////
// backにアクセするためのURL設定 //
///////////////////////////////
const CURRENT_URL = window.location.href.split('/');                         // [var] frontの現在のURL
const BASE_URL = `${CURRENT_URL[0]}//${CURRENT_URL[2].split(':')[0]}:8080/`; // [var] frontのURLを継承してportを8080に変更
// const BASE_URL = 'http://0.0.0.0:8080/';



/////////////
// 各種関数 //
///////////// 
function getItemfromId(id) { // [func] idを指定してそのタグに格納されているvalueを返すとともにlocalstrageに格納する
    val = document.getElementById(id).value;
    localStorage.setItem(id, val);
    return val
}
function getDatafromForm() { // [func] index.htmlで各種パラメータを設定した値をreturn
    const compulsory = getItemfromId('compulsory');
    const quarter    = getItemfromId('quarter');
    const special    = getItemfromId('special');
    const social     = getItemfromId('social');
    if (compulsory == 'default' | quarter == 'default' | special == 'default' | social == 'default') {
        alert('「コース選択」で未選択の項目があります');
        return false;
    }
    const alphas = [];
    for (let i=0; i<questions.length; i++) {
        let ele = document.getElementsByName('q'+String(i));
        for (let i = 0; i < ele.length; i++){
            if (ele.item(i).checked){ alphas.push(ele.item(i).value); }
        }
    }
    const l_early = document.getElementById('lecture-early').value;
    const units = [
        document.getElementById('min-units').value,
        document.getElementById('max-units').value,
    ];
    var selected_keywords = '';
    for (let i=0; i<keywords.length; i++) {
        let el = document.getElementById('key'+String(i));
        if (el.checked) { selected_keywords += `${el.value}, `; }
    }
    return {
        compulsory: compulsory,
        quarter: quarter,
        special: special,
        social: social,
        alphas: alphas,
        l_early: l_early,
        units: units,
        keywords: selected_keywords,
    };
}
function postToLocal() { // [func] getしたデータをlocalstarageに送信する
    let data = getDatafromForm();
    if (data) {
        for (let k in data) { localStorage.setItem(k, data[k]); }
        const file = document.getElementById("pdf-input").files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) { localStorage.setItem("pdfFile", event.target.result); };
            reader.readAsDataURL(file);
        } else { localStorage.setItem("pdfFile", null); }
        window.location.assign('./front/pages/table.html');
    }
};
function get(data) { // [func] localstrageにある各アイテムをバックに送信し、最適化された講義を得る
    const url = BASE_URL+'optimizer/items/';
    let body = new FormData();
    body.append('item', String(JSON.stringify(data)));

    const pdfFile = localStorage.getItem('pdfFile');
    if (pdfFile != 'null') {
        const binaryString = atob(pdfFile.split(",")[1]);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
        const blob = new Blob([bytes], { type: "application/pdf" });
        body.append('pdf_file', blob);
    } else { body.append('pdf_file', new Blob([], { type: "application/pdf" })); }

    const config = {
        method: "POST",
        body: body // [var] itemsの文字列と、pdfファイルがあるならそのバイナリの2つを格納したデータ
    }
    fetch(url, config)
    .then(response => { return response.json(); })
    .then(res => {
        loaded();
        if (!Array.isArray(res)) { alert('制約が厳しすぎます。各種パラメータを再調整してください。'); }
        else { setLocalClasses('table', res); fill(); }
    })
    .catch(e  => {
        alert(e);
        loaded();
        return false
    })
};


//////////////////////////////////////
// 時間割をアクティブにするための各種関数 //
//////////////////////////////////////
function setLocalClasses(key, classes) {
    let days = {'月曜': 'mon', '火曜': 'tue', '水曜': 'wed', '木曜': 'thu', '金曜': 'fri'}
    let times = {'１限': '1', '２限': '2', '３限': '3', '４限': '4', '５限': '5', '６限': '6'}
    const day_time_dict = new Object();
    for (let [d_jp,d_en] of Object.entries(days)) {for (let [t_jp,t_en] of Object.entries(times)) { day_time_dict[`${d_jp}${t_jp}`]=`${d_en}-${t_en}`; }}

    let new_res = {};
    for (let c of classes) {
        let whenid = [];
        for (let daytime of c.when.split('・')) { whenid.push(day_time_dict[daytime]); }
        c.whenid = whenid;
        new_res[c.classname] = c;
    }
    localStorage.setItem(key, JSON.stringify(new_res));
}
function initTable() {
    let days = ['mon', 'tue', 'wed', 'thu', 'fri'];
    let times = ['1', '2', '3', '4', '5', '6'];
    for (let day of days) { for (let time of times) {
        let el = document.getElementById(`${day}-${time}`);
        initCell(el.children);
    }}
}
function initCell(e) { if(e.length > 1){ e[0].remove(); }}
function fill() {
    initTable()
    let classes = JSON.parse(localStorage.getItem('table'));
    for (let [_,c] of Object.entries(classes)) { for (let id of c.whenid) {
        let el = document.getElementById(id);
        let incode = `
            <div id="${id}-course" class="course" onclick="popup(this)">
            <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${String(c.numofunits)} 単位</li></ul>
            </div>`
        el.insertAdjacentHTML("afterbegin", incode);
    }}
};



////////////////////////////////////////////////////////////
// backからレスが来るまでのローディングアニメーションをon, offする //
////////////////////////////////////////////////////////////
function loading() {
    const loader = document.getElementById('loader');
    const anti = document.getElementById('antiload');
    loader.classList.remove('loaded');
    anti.style.display = 'none';
}
function loaded() {
    const loader = document.getElementById('loader');
    const anti = document.getElementById('antiload');
    loader.classList.add('loaded');
    anti.style.display = '';
}


/////////////////////////////////////////////////////////////
// セルを選択した時のポップアップウィンドウをアクティブにする各種関数 //
/////////////////////////////////////////////////////////////
function isinCell(day, time) {
    let act_course_el = document.getElementById(`${day}-${time}-course`);
    if (act_course_el == null) { return false; } else { return act_course_el.firstElementChild.firstElementChild.textContent; }
}
function removeCand() { document.getElementById('classes-wrapper').remove(); }
function setCand(classes, [day, time]) {
    setLocalClasses('candidates', classes);

    let popclass_el = document.getElementById('popup-classes');
    let inline = `<div id="classes-wrapper">
        <p value="${day}-${time}">
        ${localStorage.getItem('quarter')},
        ${{'mon': '月曜', 'tue': '火曜', 'wed': '水曜', 'thu': '木曜', 'fri': '金曜'}[day]} 
        ${time}限</p>`;
    let active_class = isinCell(day, time);
    if (!active_class) {inline += 'stage<div class="border"></div>'; }
    let inline_ = '';
    for (let c of classes) {
        if (active_class && active_class == c.classname) {
            inline += `<button class="course popup-course" onclick="outStage(this)">
                       <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li><li>${c.when}</li></ul>
                       </button>stage<div class="border"></div>`;
            continue;
        }
        inline_ += `<button class="course popup-course" onclick="onStage(this)">
                    <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li><li>${c.when}</li></ul>
                    </button>`;
    }
    inline += inline_;
    popclass_el.insertAdjacentHTML("beforeend", `${inline}</div>`);
}
function getFillDaytimes(table) {
    let filldaytimes = new Object();
    for (let [_, c] of Object.entries(table)) { for (let daytime of c.whenid) { filldaytimes[`${daytime}`] = ''; }}
    return filldaytimes
}
function popup(cell) {
    document.getElementById('popup-window').style.display = 'block';

    const url = BASE_URL+'optimizer/cell/';
    const config = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            quarter: {'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4}[localStorage.getItem('quarter')],
            daytime: cell.parentNode.id
        }),
    }

    fetch(url, config)
    .then(data => { return data.json(); })
    .then(res  => {
        setCand(JSON.parse(res)['data'], cell.parentNode.id.split('-'));
    })
    .catch(e   => {
        alert(e);
        return false
    })
}
function hidePopup() {
    document.getElementById('popup-window').style.display = 'none';
    removeCand();
}
window.onclick = function(event) {
    const popwin = document.getElementById('popup-window');
    if (event.target == popwin) { popwin.style.display = "none"; removeCand(); }
}



/////////////////////////////
// 講義を追加・削除する各種関数 //
/////////////////////////////
function onStage(e) {
    let children = e.parentNode.children;
    let toStageid = null;
    for (let i=0; i<children.length; i++) { if (children[i] == e) {toStageid = i;} }
    if (children[2].tagName == 'DIV') {
        let p0 = children[1].querySelector('ul');
        let p1 = children[toStageid].querySelector('ul');
        children[1].replaceChild(p1, p0);
        children[toStageid].appendChild(p0);
    } else {
        let ts = children[toStageid].querySelector('ul').children;
        children[toStageid].remove();
        let incode = `<button class="course popup-course" onclick="outStage(this)"><ul>`;
        for (let i=0; i<ts.length; i++) { incode += `<li>${ts[i].textContent}</li>` }
        incode += `</ul></button>`
        children[0].insertAdjacentHTML("afterend", incode);
    }
}
function outStage(e) {
    let children = e.parentNode.children;
    es = e.querySelector('ul').children;
    e.remove();
    let incode = `<button class="course popup-course" onclick="onStage(this)"><ul>`;
    for (let i=0; i<es.length; i++) { incode += `<li>${es[i].textContent}</li>` }
    children[1].insertAdjacentHTML("afterend", `${incode}</ul></button>`);
}
function setLecture() {
    function textContent(e) { return e.querySelector('ul').firstChild.textContent; }
    function getExDaytime(c, dt) { let cw = c.whenid; if(cw.length==2){if(cw[0]==dt){return [cw[1],c.when.split('・')[1]];}else{return [cw[0],c.when.split('・')[0]];}}}
    function f(t, le, e=null, c=null) {                             // [func] 最終的に講義の追加や削除をする関数
        new Promise((resolve, reject) => {setTimeout(() => {
            for(let l of le) { if (l != null) { delete t[textContent(l)]; }}
            if (c != null) { t[textContent(e)] = c; }
            localStorage.setItem('table', JSON.stringify(t));
            resolve();
        }, 10)}).then(() => { fill(); hidePopup(); });
    }
    setUnitNum();
    
    let table = JSON.parse(localStorage.getItem('table'));           // [var] localのtable
    let filled_daytimes = getFillDaytimes(table);                    // [var] tableに埋まっている講義の曜日時限
    let candidates = JSON.parse(localStorage.getItem('candidates')); // [var] 選択したセルの曜日時限と一致する講義候補
    let e = document.getElementById('classes-wrapper');              // [var] 選択したセルの曜日時限と一致する講義の親エレメント
    let daytime = e.children[0].getAttribute('value');               // [var] 選択したセルの曜日時限
    let lec_e = document.getElementById(`${daytime}-course`);        // [var] 選択したセルに既にセットされている講義

    if (e.children[1].tagName == 'BUTTON') {                         // [cond] 講義がステージングされている時（講義を追加する時）
        let candidate = candidates[textContent(e.children[1])];           // [var] ステージングされた講義
        let [i, ijp] = getExDaytime(candidate, daytime);                  // [var] ステージングされた講義の選択している曜日時限以外の曜日時限
        if (i in filled_daytimes) {                                       // [cond] 追加する時にconflictがあった時
            let conflicted_class = document.getElementById(`${i}-course`) // [var] コンフリクトされた側の講義
            if (textContent(conflicted_class) != candidate.classname) {
                result = confirm(
                    `"${ijp}"でコンフリクトが発生しました。\n`+
                    `「${textContent(conflicted_class)}」を削除して「${candidate.classname}」を登録しますか？`
                );
                if (result) { f(table, le=[lec_e, conflicted_class], e=e.children[1], c=candidate); } else { hidePopup(); }
            } else { hidePopup(); }
        } else { f(table, le=[lec_e], e=e.children[1], c=candidate); }      // [cond] 追加時のconflictがなかった時
    } else { f(table, le=[lec_e]); }                                 // [cond] 講義が何もステージングされていない時（講義を削除する時）
}

function setFixedLecture() {
    result = confirm(`ステージングされた講義を固定しますか？`);
    if (result) { 
        setLecture();
    } else { console.log('固定がキャンセルされました'); }
}