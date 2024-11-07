
const CURRENT_URL = window.location.href.split('/');
const BASE_URL = `${CURRENT_URL[0]}//${CURRENT_URL[2].split(':')[0]}:8080/`;
// const BASE_URL = 'http://0.0.0.0:8080/';

function getItemfromId(id) {
    val = document.getElementById(id).value;
    localStorage.setItem(id, val);
    return val
}
function getDatafromForm() {
    const compulsory = getItemfromId('compulsory');
    // const grade = getItemfromId('grade');
    const quarter = getItemfromId('quarter');
    const special = getItemfromId('special');
    const social = getItemfromId('social');
    // if (compulsory == 'default' | grade == 'default' | quarter == 'default' | special == 'default' | social == 'default') {
    if (compulsory == 'default' | quarter == 'default' | special == 'default' | social == 'default') {
        alert('「コース選択」で未選択の項目があります');
        return false;
    }

    const alphas = [];
    for (let i=0; i<questions.length; i++) {
        let ele = document.getElementsByName('q'+String(i));
        for (let i = 0; i < ele.length; i++){
            if (ele.item(i).checked){
                alphas.push(ele.item(i).value);
            }
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
        // grade: grade,
        quarter: quarter,
        special: special,
        social: social,
        alphas: alphas,
        l_early: l_early,
        units: units,
        keywords: selected_keywords,
    };
}
function postToLocal() {
    let data = getDatafromForm();
    for (let k in data) { localStorage.setItem(k, data[k]); }

    const file = document.getElementById("pdf-input").files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Data = event.target.result;
            localStorage.setItem("pdfFile", base64Data);
        };
        reader.readAsDataURL(file);
    } else {
        localStorage.setItem("pdfFile", null);
    }
    window.location.assign('./front/pages/table.html');
};

function get(data) {
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
    } else {
        body.append('pdf_file', new Blob([], { type: "application/pdf" }));
    }

    const config = {
        method: "POST",
        body: body
    }

    fetch(url, config)
    .then(response => { return response.json(); })
    .then(res => {
        loaded();
        if (res == '制約が厳しすぎます。') { alert('制約が厳しすぎます。各種パラメータを再調整してください。'); }
        else { fill(res.time_table); }
    })
    .catch(e  => {
        alert(e);
        loaded();
        return false
    })
};

function initTable(e) {
    if (e.length > 1) {
        e[0].remove();
    }
}

function fill(table) {
    for (let i of ['1', '2', '3', '4', '5', '6']) {
        for (let day of ['mon', 'tue', 'wed', 'thu', 'fri']) {
            let c = table[i][day];
            let el = document.getElementById(`${day}-${i}`);
            initTable(el.children);
            if (c != null) {
                let incode = `
                    <div id="${day}-${i}-course" class="course" onclick="popup(this)">
                    <ul><li>${c.name}</li><li>${c.teacher}</li><li>${String(c.unit)} 単位</li></ul>
                    </div>`
                el.insertAdjacentHTML("afterbegin", incode);
            }
        }
    }
};

//loading
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


// popup
function isinCell(day, time) {
    let act_course_el = document.getElementById(`${day}-${time}-course`);
    if (act_course_el == null) { return false; } else {
        return act_course_el.firstElementChild.firstElementChild.textContent;
    }
}
function removeCand() { document.getElementById('classes-wrapper').remove(); }
function setCand(classes, [day, time]) {
    let popclass_el = document.getElementById('popup-classes');
    let inline = `
        <div id="classes-wrapper">
        <p value="${day}-${time}">
            ${localStorage.getItem('quarter')},
            ${{'mon': '月曜', 'tue': '火曜', 'wed': '水曜', 'thu': '木曜', 'fri': '金曜'}[day]} 
            ${time}限
        </p>
    `;
    let active_class = isinCell(day, time);
    if (!active_class) {inline += 'stage<div class="border"></div>'; }
    let inline_ = '';
    for (let c of classes) {
        if (active_class && active_class == c.classname) {
            inline += `<button class="course popup-course" onclick="outStage(this)">
                       <ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li></ul>
                       </button>stage<div class="border"></div>`;
            continue;
        }
        inline_ += `<button class="course popup-course" onclick="onStage(this)"><ul><li>${c.classname}</li><li>${c.teacher}</li><li>${c.numofunits} 単位</li></ul></button>`;
    }
    inline += inline_;
    popclass_el.insertAdjacentHTML("beforeend", `${inline}</div>`);
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

// 講義登録
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
        let incode = `
            <button class="course popup-course" onclick="outStage(this)">
            <ul><li>${ts[0].textContent}</li><li>${ts[1].textContent}</li><li>${ts[2].textContent}</li></ul>
            </button>`;
        children[0].insertAdjacentHTML("afterend", incode);
    }
}
function outStage(e) {
    let children = e.parentNode.children;
    es = e.querySelector('ul').children;
    e.remove();
    let incode = `
        <button class="course popup-course" onclick="onStage(this)">
        <ul><li>${es[0].textContent}</li><li>${es[1].textContent}</li><li>${es[2].textContent}</li></ul>
        </button>`;
    children[1].insertAdjacentHTML("afterend", incode);
}
function setLecture() {
    let e = document.getElementById('classes-wrapper');
    let daytime = e.children[0].getAttribute('value');
    let lec_e = document.getElementById(`${daytime}-course`);
    if (lec_e != null) {
        if (e.children[1].tagName == 'BUTTON') { lec_e.replaceChild(e.children[1].querySelector('ul'), lec_e.querySelector('ul')); hidePopup();}
        else { lec_e.remove(); hidePopup(); }
    } else {
        if (e.children[1].tagName == 'BUTTON') {
            let cell_e = document.getElementById(daytime);
            let es = e.children[1].querySelector('ul').children;
            let incode = `
                <div id="${daytime}-course" class="course" onclick="popup(this)">
                <ul><li>${es[0].textContent}</li><li>${es[1].textContent}</li><li>${es[2].textContent}</li></ul>
                </div>`
            cell_e.insertAdjacentHTML("afterbegin", incode);
            hidePopup();
        }
        else { hidePopup(); }
    }
}
