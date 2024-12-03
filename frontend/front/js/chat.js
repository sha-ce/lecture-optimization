//////////////
// LLM chat //
//////////////
function openChat() { document.getElementById('dialog').style.display = 'block'; } // [func] chatウィンドウを表示する関数
function closeChat() { document.getElementById('dialog').style.display = 'none'; } // [func] chatウィンドウを非表示にする関数
function openCloseChat() {                                                         // [func] chatウィンドウの表示・非表示を切り替える関数
    let estyle = document.getElementById('dialog').style.display;
    if (estyle == 'none') { openChat(); } else { closeChat(); }
}

const chatWindow = document.getElementById("chat-window"); // [var] chatウィンドウを表示するエレメント
const chatInput = document.getElementById("chat-input");   // [var] テキスト入力部分のエレメント
const sendButton = document.getElementById("send-button"); // [var] テキスト送信ボタンのエレメント

function addMessage(content, sender) {                     // [func] 通常のメッセージを追加する関数
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);
    messageDiv.textContent = content;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}
function typeMessage(message, sender, t=20) {              // [func] LLMの出力をストリーミングアニメーションで出力する
    const wrap = document.createElement("div");
    wrap.classList.add('message-wrapper');

    const icon = document.createElement("img");
    icon.src = '../../favicon.ico';
    icon.classList.add('message-icon');
    wrap.appendChild(icon);
    
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender, "typing");
    wrap.appendChild(messageDiv);

    chatWindow.appendChild(wrap);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    let currentIndex = 0;
    const interval = setInterval(() => {
        messageDiv.classList.remove("typing");
        messageDiv.textContent += message[currentIndex];
        currentIndex++;
        if (currentIndex === message.length) { clearInterval(interval); messageDiv.classList.remove("typing"); }
    }, t); // 20ms
}
function chatLoading() {
    let wrap = document.createElement("div");
    wrap.id = 'message-loader';
    wrap.classList.add('message-wrapper');

    const icon = document.createElement("img");
    icon.src = '../../favicon.ico';
    icon.classList.add('message-icon');
    wrap.appendChild(icon);

    const loading_animation = document.createElement('div');
    loading_animation.classList.add('message', 'bot');

    let la = document.createElement('div')
    la.classList.add('loading-animation');
    for (let i=0; i<3; i++) { la.appendChild(document.createElement('div')); }
    loading_animation.appendChild(la);
    
    wrap.appendChild(loading_animation);
    chatWindow.appendChild(wrap);
}
function chatLoaded() {
    document.getElementById('message-loader').remove();
}
// [var] チャット履歴を格納する変数、初期値にLLM側のテキストを入れる。
var chatHistory = ['僕はみんなの要望を受けて、時間割の提案を変更するエージェントだよ。何か要望があれば言ってね。'];
typeMessage(chatHistory[0], "bot");

function sendMessage() {                                                     // [func] メッセージ送信のハンドラー
    const message = chatInput.value.trim();                                  // [var] userが入力したテキスト
    if (message) {
        addMessage(message, 'user');                                         // [process] ウィンドウにテキストを表示
        chatInput.value = '';                                                // [process] 入力を空にする
        if (chatHistory.length > 5) { chatHistory.splice(1, 2); }            // [process] 履歴を全て送信するとターン数が多くなると遅くなるので3ターン(len=5)後からidx=0だけ残してidx=1,2の記憶を消去
        chatHistory.push(message);
        chatLoading();

        let alphas = localStorage.getItem('alphas').split(',').map(Number);
        let social = localStorage.getItem('social');
        let special = localStorage.getItem('special');
        let semester = localStorage.getItem('quarter');
        console.log(alphas, social, special, semester);
        const url = BASE_URL+'llm/chat';
        const config = {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                questions: chatHistory,
                preferences: {
                    "Few early morning classes": alphas[5],
                    "Optimization of class days": alphas[0],
                    "Optimization of credit hours": alphas[2],
                    "Fewer remote classes": alphas[3],
                    "Fewer courses of interest": alphas[4],
                    "Fewer exams": alphas[6],
                    "Fewer assignments": alphas[1],
                },
                user_info: {
                    "social": social,
                    "special": special,
                    "quarter": semester,
                }
            }),
        }
        fetch(url, config)
        .then(data => { return data.json(); })
        .then(res  => {
            let resparams = res.new_params;
            console.log(resparams);
            if (resparams != null){
                let new_alphas = [
                    resparams["Optimization of class days"],
                    resparams["Fewer assignments"],
                    resparams["Optimization of credit hours"],
                    resparams["Fewer remote classes"],
                    resparams["Fewer courses of interest"],
                    resparams["Few early morning classes"],
                    resparams["Fewer exams"],
                ]
                localStorage.setItem('alphas', new_alphas);
            } else {
                console.log("Null response received, retaining original parameters");
            }
            setInfo();
            chatLoaded();
            let llmans = res.response.slice(-1)[0];
            typeMessage(llmans, 'bot');
            chatHistory.push(llmans);
        })
        .catch(e   => {
            console.log(e);
            typeMessage('ERROR：もう一回入力して。', 'bot');
            chatHistory.pop();
            return false
        })
    }
}
sendButton.addEventListener("click", sendMessage);                                           // [process] 送信ボタンのクリックイベント
chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") { sendMessage(); }}); // [process] エンターでも送信ボタンをクリック

function reOptimize() { optimize(); }                                                        // [func] 再最適化のボタン