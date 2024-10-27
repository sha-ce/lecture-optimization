
const CURRENT_URL = window.location.href.split('/');
const BASE_URL = `${CURRENT_URL[0]}//${CURRENT_URL[2].split(':')[0]}:8080/`

function getItemfromId(id) {
    val = document.getElementById(id).value;
    localStorage.setItem(id, val);
    return val
}
function getDatafromForm() {
    const compulsory = getItemfromId('compulsory');
    const grade = getItemfromId('grade');
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

    const selected_keywords = [];
    for (let i=0; i<keywords.length; i++) {
        let el = document.getElementById('key'+String(i));
        if (el.checked) { selected_keywords.push(el.value); }
    }

    return {
        compulsory: compulsory,
        grade: grade,
        quarter: quarter,
        special: special,
        social: social,
        alphas: alphas,
        l_early: l_early,
        units: units,
        keywords: selected_keywords,
    };
}
function post(local=false) {
    let data = getDatafromForm();
    
    if (local) {
        window.location.assign('./front/pages/table.html');
        return false
    }

    const url = BASE_URL+'optimizer/conditions/';
    const config = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    }
    fetch(url, config)
    .then(data => { return data.json(); })
    .then(res  => {
        window.location.assign('./front/pages/table.html');
    })
    .catch(e   => {
        alert(e);
        return false
    })
};

function get() {
    const url = BASE_URL+'optimizer/items/';
    const config = {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    }
    
    fetch(url, config)
    .then(response => { return response.json(); })
    .then(res => {
        loaded();
        fill(res.time_table);
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
                let incode = '<div class="course"><ul><li>'+c.name+'</li><li>'+c.teacher+'</li><li>'+String(c.unit)+'単位</li></ul></div>'
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
function removeCand() { document.getElementById('classes-wrapper').remove(); }
function setCand(classes) {
    let popclass_el = document.getElementById('popup-classes');
    let inline = `<div id="classes-wrapper" class="">`;
    for (let c of classes) { inline += `<div class="">${c.classname}</div>`; }
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
        setCand(JSON.parse(res)['data']);
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
