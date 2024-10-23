function updateValueFromSlider(id, value) {
    document.getElementById(id).value = value;
}
function updateValueFromInput(id, value) {
    const slider = document.getElementById(id);
    if (value >= slider.min && value <= slider.max) {slider.value = value;}
}

// const BASE_URL = 'http://127.0.0.1:8000/'
const ip = document.getElementById('ip').value;
const BASE_URL = 'http://'+ip+':8000/';

function post() {
    const compulsory = document.getElementById('compulsory').value;
    const grade = document.getElementById('grade').value;
    const quarter = document.getElementById('quarter').value;
    const special = document.getElementById('special').value;
    const social = document.getElementById('social').value;
    const nums = [];
    for (let i of ['number1', 'number2', 'number3']) {
        nums.push(document.getElementById(i).value);
    }
    const keywords = [];
    for (let i=1; i<=20; i++) {
        let el = document.getElementById('key'+String(i));
        if (el.checked) { keywords.push(el.value); }
    }

    let data = {
        compulsory: compulsory,
        grade: grade,
        quarter: quarter,
        special: special,
        social: social,
        nums: nums,
        keywords: keywords,
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
    const url = BASE_URL+'table/';
    const config = {
        method: "GET",
        headers: {"Content-Type": "application/json"},
    }
    
    fetch(url, config)
    .then(response => { return response.json(); })
    .then(res => { fill(res.time_table); })
    .catch(e  => { console.log(e); })
};

function fill(table) {
    for (let i of ['1', '2', '3', '4', '5', '6']) {
        for (let day of ['mon', 'tue', 'wed', 'thu', 'fri']) {
            let c = table[i][day];
            if (c != null) {
                let el = document.getElementById(day+i);
                let incode = '<div class="course"><ul><li>'+c.name+'</li><li>'+c.teacher+'</li><li>'+String(c.unit)+'単位</li></ul></div>'
                el.insertAdjacentHTML("afterbegin", incode);
            }
        }
    }
};

function addLecture(a) {
    console.log('まだ実装してないよ😢');
}