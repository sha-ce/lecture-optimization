///////////////////////////////
// backにアクセするためのURL設定 //
///////////////////////////////
// const CURRENT_URL = window.location.href.split('/');                         // [var] frontの現在のURL
// const BASE_URL = `${CURRENT_URL[0]}//${CURRENT_URL[2].split(':')[0]}:8080/`; // [var] frontのURLを継承してportを8080に変更
const BASE_URL = 'https://lectopt.fly.dev/';



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
        // headers: {'Content-Type': 'multipart/form-data'},
        body: body // [var] itemsの文字列と、pdfファイルがあるならそのバイナリの2つを格納したデータ
    }
    fetch(url, config)
    .then(response => { return response.json(); })
    .then(res => {
        loaded();
        // console.log(res);
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
    return new_res;
}
function initTable() {
    let days = ['mon', 'tue', 'wed', 'thu', 'fri'];
    let times = ['1', '2', '3', '4', '5', '6'];
    for (let day of days) { for (let time of times) {
        let el = document.getElementById(`${day}-${time}`);
        initCell(el.children);
    }}

    for (let id of ['anytime', 'intensive']) {
        let el = document.getElementById(id);
        while (el.firstChild) { el.removeChild(el.firstChild); }
    }
}
function initCell(e) { if(e.length > 1){ e[0].remove(); }}
function insertHTML(id, c, style='') {
    let isO = (style == '')? false: true;
    let incode = `<div id="${id}-course" class="course ${style}" onclick="popup(this, isOthers=${isO})" oncontextmenu="setFixedLecture(this)"><ul><li>${c.classname}</li><li>${c.teacher}</li><li>${String(c.numofunits)} 単位</li></ul></div>`;
    document.getElementById(id).insertAdjacentHTML("afterbegin", incode);
}
function fill() {
    initTable();
    let classes = JSON.parse(localStorage.getItem('table'));
    let fixed_classes = localStorage.getItem('must_select_classes').split(',');

    for (let [name, c] of Object.entries(classes)) {
        let fixed_style = fixed_classes.includes(name) ? 'course-fixed' : '';
        if (c.when == '集中講義') { insertHTML('intensive', c, style=`course-others ${fixed_style}`); continue; }
        else if (c.when == '非同期') { insertHTML('anytime', c, style=`course-others ${fixed_style}`); continue; }
        for (let id of c.whenid) { insertHTML(id, c, style=fixed_style); }
    }
    new Promise((resolve, reject) => {
        setTimeout(() => {resolve(); }, 100);
    }).then(() => { setUnitNum(); });
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
function setCand(classes, when, isOthers=false) {
    if (!isOthers) {
        let [day, time] = when.split('-');
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
                inline += `<button class="course popup-course" onclick="outStage(this)" oncontextmenu="classDetails(this)">
                        <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li><li>${c.when}</li></ul>
                        </button>stage<div class="border"></div>`;
                continue;
            }
            inline_ += `<button class="course popup-course" onclick="onStage(this)" oncontextmenu="classDetails(this)">
                        <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li><li>${c.when}</li></ul>
                        </button>`;
        }
        inline += inline_;
        popclass_el.insertAdjacentHTML("beforeend", `${inline}</div>`);
    } else {
        classes = setLocalClasses('candidates', classes);

        let popclass_el = document.getElementById('popup-classes');
        let inline = `<div id="classes-wrapper"><p value="${when}">${localStorage.getItem('quarter')},${when}</p>`;

        for (let [k, c] of Object.entries(JSON.parse(localStorage.getItem('table')))) {
            if (c.when == when) { 
                delete classes[k];
                inline += `
                    <button class="course popup-course" onclick="outStage(this, isOthers=true)" oncontextmenu="classDetails(this)">
                    <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li><li>${c.when}</li></ul>
                    </button>`;
            }
        }
        inline += 'stage<div class="border"></div>';
        for (let [_,c] of Object.entries(classes)) {
            inline += `
                <button class="course popup-course" onclick="onStage(this, isOthers=true)" oncontextmenu="classDetails(this)">
                <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li><li>${c.when}</li></ul>
                </button>`;
        }
        popclass_el.insertAdjacentHTML("beforeend", `${inline}</div>`);
    }
}
function getFillDaytimes(table) {
    let filldaytimes = new Object();
    for (let [_, c] of Object.entries(table)) { for (let daytime of c.whenid) { filldaytimes[`${daytime}`] = ''; }}
    return filldaytimes
}
function popup(cell, isOthers=false) {
    let cel_id = cell.parentNode.id == '' ? cell.parentNode.parentNode.children[1].id : cell.parentNode.id;
    let when = cel_id == 'anytime' ? '非同期': ( cel_id == 'intensive' ? '集中講義' : cel_id);
    let quarter = when == '集中講義' ? {'Q1': '前期', 'Q2': '前期', 'Q3': '後期', 'Q4': '後期'}[localStorage.getItem('quarter')] : {'Q1': '第1クォーター', 'Q2': '第2クォーター', 'Q3': '第3クォーター', 'Q4': '第4クォーター'}[localStorage.getItem('quarter')];

    document.getElementById('popup-window').style.display = 'block';

    const url = BASE_URL+'optimizer/cell/';
    const config = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({quarter: quarter, daytime: when})
    }

    fetch(url, config)
    .then(data => { return data.json(); })
    .then(res  => {
        setCand(JSON.parse(res)['data'], when, isOthers=isOthers);
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
function onStage(e, isOthers=false) {
    if (isOthers) {
        let cs = e.querySelector('ul').children;
        inline = `<button class="course popup-course" onclick="outStage(this, isOthers=true)" oncontextmenu="classDetails(this)"><ul>`;
        for (let i=0; i<cs.length; i++) { inline += `<li>${cs[i].textContent}</li>` }
        e.parentNode.children[0].insertAdjacentHTML("afterend", `${inline}</ul></button>`);
        e.remove();
    } else {
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
            let incode = `<button class="course popup-course" onclick="outStage(this)" oncontextmenu="classDetails(this)"><ul>`;
            for (let i=0; i<ts.length; i++) { incode += `<li>${ts[i].textContent}</li>` }
            incode += `</ul></button>`
            children[0].insertAdjacentHTML("afterend", incode);
        }
    }
}
function outStage(e, isOthers=false) {
    if (isOthers) {
        let cs = e.querySelector('ul').children;
        inline = `<button class="course popup-course" onclick="onStage(this, isOthers=true)" oncontextmenu="classDetails(this)"><ul>`;
        for (let i=0; i<cs.length; i++) { inline += `<li>${cs[i].textContent}</li>` }
        e.parentNode.children[e.parentNode.children.length-1].insertAdjacentHTML("afterend", `${inline}</ul></button>`);
        e.remove();
    } else {
        let children = e.parentNode.children;
        es = e.querySelector('ul').children;
        e.remove();
        let incode = `<button class="course popup-course" onclick="onStage(this)" oncontextmenu="classDetails(this)"><ul>`;
        for (let i=0; i<es.length; i++) { incode += `<li>${es[i].textContent}</li>` }
        children[1].insertAdjacentHTML("afterend", `${incode}</ul></button>`);
    }
}
function setLecture() {
    // [func] 授業エレメントの授業名を返す関数
    function textContent(e) { return e.querySelector('ul').firstChild.textContent; }
    // [func] ボタンが押された時にステージングされている講義を返す関数
    function getStagedClasses(es, cands) { let staged = {}; let i=1; while(es[i].tagName != 'DIV') { staged[textContent(es[i])] = cands[textContent(es[i])]; i++; } return staged; }
     // [func] ボタンが押された時にステージングされていない講義を返す関数
    function getUnStagedClasses(es, cands) { let unstaged = {};let start = false;for (let i=0; i<es.length; i++){if (start) {let name = textContent(es[i]);unstaged[name] = cands[name];}if (es[i].tagName == 'DIV') {start = true;}}return unstaged;}
    // [func] 普通のテーブルに乗せるべき講義か、非同期もしくは集中講義であるかの判定
    function isOthersTable(staged, unstaged) {if (Object.keys(staged).length > 0) {if (['非同期', '集中講義'].includes(Object.entries(staged)[0][1].when)) {return true;} else { return false; }} else if (Object.keys(unstaged).length > 0) {if (['非同期', '集中講義'].includes(Object.entries(unstaged)[0][1].when)) {return true;} else { return false; }} else {hidePopup();}}
    // [func] ステージングされている講義の中で週2で開講される講義を対象に、選択されたセルの曜日時限ではない方の曜日時限を取得する関数
    function getExDaytime(staged, daytime) {let when = Object.entries(staged)[0][1].whenid; if (when.length == 2) {if(when[0] == daytime) {return [when[1], Object.entries(staged)[0][1].when.split('・')[1]]; } else {return [when[0], Object.entries(staged)[0][1].when.split('・')[0]]; }} else {return [when[0], null]}}
    // [func] 最終的に講義の追加や削除をする関数
    function execute(table, deletes=[null], adds=[[null, null]]) {new Promise((resolve, reject) => {setTimeout(() => {for(let del of deletes) { del != null && delete table[textContent(del)]; } for(let [_, add] of adds) {if (add != null) {table[add.classname] = add; }} localStorage.setItem('table', JSON.stringify(table)); resolve();}, 10)}).then(() => { fill(); hidePopup(); })}
    // [func] コンフリクトを起こした時の処理
    function conflictionProcess(table, staged, ex, wjp, filled, set) {let conflicting = Object.entries(staged)[0][1]; let conflicted = document.getElementById(`${ex}-course`); if (ex in filled) {if (textContent(conflicted) != conflicting.classname && wjp != null) { result = confirm(`"${wjp}"でコンフリクトが発生しました。\n「${textContent(conflicted)}」を削除して「${conflicting.classname}」を登録しますか？`); if (result) { execute(table, deletes=[set, conflicted], adds=[[null, conflicting]]); } else { hidePopup(); }} else {execute(table, deletes=[set, conflicted], adds=[[null, conflicting]]);}} else { execute(table, deletes=[set], adds=[[null, conflicting]]); }}
    // [func] 通常時の処理
    function usualProcess(table, staged_candidates, daytime, filled_daytimes, set_lecture) {if (Object.keys(staged_candidates).length > 0) {let [when_ex, when_jp] = getExDaytime(staged_candidates, daytime);conflictionProcess(table, staged_candidates, when_ex, when_jp, filled_daytimes, set_lecture);} else {execute(table, deletes=[set_lecture]);}}
    // [func] 非同期講義や集中講義の時の処理
    function othersProcess(table, staged, unstaged) {let adds = [[null, null]];for (let [k, c] of Object.entries(staged)) {if (!Object.keys(table).includes(k)) {adds.push([k, c]);}}for (let [k, _] of Object.entries(unstaged)) {if (Object.keys(table).includes(k)) {delete table[k];}}execute(table, deletes=[null], adds=adds);}

    let table = JSON.parse(localStorage.getItem('table'));            // [var] localのtable
    if (table == null) { table = []; }
    let filled_daytimes = getFillDaytimes(table);                     // [var] tableに埋まっている講義の曜日時限
    let e = document.getElementById('classes-wrapper');               // [var] 選択したセルの曜日時限と一致する講義の親エレメント
    let daytime = e.children[0].getAttribute('value');                // [var] 選択したセルの曜日時限
    let set_lecture = document.getElementById(`${daytime}-course`);   // [var] 選択したセルに既にセットされている講義
    let candidates = JSON.parse(localStorage.getItem('candidates'));  // [var] 選択したセルの曜日時限と一致する講義候補(popupに表示される講義)
    let staged_candidates = getStagedClasses(e.children, candidates); // [var] ステージングされている講義
    let unstaged = getUnStagedClasses(e.children, candidates);        // [var] ステージングされている講義

    if (isOthersTable(staged_candidates, unstaged)) {
        othersProcess(table, staged_candidates, unstaged);
    } else {
        usualProcess(table, staged_candidates, daytime, filled_daytimes, set_lecture);
    }
    new Promise((resolve, reject) => { setTimeout(() => {resolve(); }, 10); }).then(() => { setUnitNum(); });
}

function setFixedLecture(e) {
    let class_name = e.querySelector('ul').firstChild.textContent;
    let must_classes = localStorage.getItem('must_select_classes').split(',');
    if (must_classes.includes(class_name)) {
        result = confirm(`「${class_name}」固定を解除しますか？`);
        if(result) {
            must_classes.splice(must_classes.indexOf(class_name), 1);
            localStorage.setItem('must_select_classes', must_classes);
            fill();
        }
    } else {
        result = confirm(`「${class_name}」を固定しますか？`);
        if (result) { 
            must_classes.unshift(class_name);
            localStorage.setItem('must_select_classes', must_classes);
            fill();
        }
    }
}


function classDetails(el) {
    let win = document.getElementById('class-details');
    while (win.firstChild) { win.removeChild(win.firstChild); }
    document.getElementById('popup-window').addEventListener('contextmenu', function(e) { 
        win.style.left = `${e.pageX}px`;
        if (e.clientY+400 > window.innerHeight) { win.style.bottom = '10px'; }
        else { win.style.top = `${e.clientY}px`; }
        win.style.display = 'block'; 
    });

    let class_name = el.querySelector('ul').firstChild.textContent;
    let class_info = JSON.parse(localStorage.getItem('candidates'))[class_name]

    let test = (class_info.test == 'yes') ? 'あり': 'なし';
    let remote = (class_info.remote == 'yes') ? '遠隔': '対面';

    win.insertAdjacentHTML("afterbegin", `
        <p>-- 授業詳細 --</p>
        <p>${class_info.classname}</p>
        <p>${class_info.teacher}</p>
        <p>${class_info.unitclass}, ${class_info.numofunits} 単位</p>
        <p>${class_info.when}</p>
        <p>試験${test}?</p>
        <p>${remote}</p>
        <p>課題 Lv.${class_info.homework}</p><br>
        <p>-- Outline --</p>
        <p>${class_info.classoutline}</p><br>
        <p>-- Keywords --</p>
        <p>${class_info.keyword}</p>
    `);
}
document.body.addEventListener('click', function(e) { document.getElementById('class-details').style.display = 'none'; });