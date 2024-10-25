var BASE_URL = 'http://127.0.0.1:8000/';
function setIP() {
    // const BASE_URL = 'http://127.0.0.1:8000/'
    var ip = document.getElementById('ip');
    BASE_URL = ip.value+':8000/';
    ip.value = '';
    ip.placeholder = 'Completed !';
    alert('set: '+BASE_URL);
}

function getItemfromId(id) {
    val = document.getElementById(id).value;
    localStorage.setItem(id, val);
    return val
}
function toConditions() {
    const compulsory = getItemfromId('compulsory');
    const grade = getItemfromId('grade');
    const quarter = getItemfromId('quarter');
    const special = getItemfromId('special');
    const social = getItemfromId('social');
    if (compulsory == 'default' | grade == 'default' | quarter == 'default' | special == 'default' | social == 'default') {
        alert('未選択の項目があります');
        return false;
    }

    let cource_select = document.getElementById('question-cource-select');
    cource_select.style.display = 'none';

    let conditions_select = document.getElementById('question-conditions-select');
    conditions_select.style.display = '';
}
function post() {
    const compulsory = getItemfromId('compulsory');
    const grade = getItemfromId('grade');
    const quarter = getItemfromId('quarter');
    const special = getItemfromId('special');
    const social = getItemfromId('social');
    if (compulsory == 'default' | grade == 'default' | quarter == 'default' | special == 'default' | social == 'default') {
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

    let data = {
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

    const url = BASE_URL+'conditions/';
    const config = {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
    }

    fetch(url, config)
    .then(data => { return data.json(); })
    .then(res  => { window.location.assign('./front/pages/table.html'); })
    .catch(e   => { console.log(e); })
};

function get() {
    loading();

    const url = BASE_URL+'items/';
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
    .catch(e  => { console.log(e); })
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
            let el = document.getElementById(day+i);
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


function addLecture() {
    document.getElementById('popup-window').style.display = 'block';
}
function hidePopup() {
    document.getElementById('popup-window').style.display = 'none';
}
window.onclick = function(event) {
    const puwin = document.getElementById('popup-window');
    if (event.target == puwin) { puwin.style.display = "none"; }
}
