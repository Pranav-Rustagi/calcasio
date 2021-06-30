var display, op_sign, noofdigits, countInps = 0;

var flagOn = false;
var tempInp;
var operationSeq = [];
var flagFirstRunOperations = true;
var tempSeq;
var replayTimeOut;


// fontloader api to check whether font file has been loaded or not
WebFontConfig = {
    custom: {
        families: ['digital'],
        urls: ['style.css']
    },
    active: function () {
        console.info("Font file loaded successfully");
        $('#loadingScreen').delay(1000).fadeOut("slow" , function () {
            $('#on').on('click', calcOn);
            $(window).on('keydown', (e) => {
                if (e.keyCode === 27)
                    calcOn();
            })

            $(this).remove();

            display = $('#display');
            op_sign = $('#op_sign');
            noofdigits = $('#noofdigits');
        });
    },
    inactive: function () {
        let choice = confirm("Page resources could not be loaded!\nReload page?");
        if (choice)
            location.reload();
        else
            history.back;
    }
};


// Binding event on "on" button when everything gets loaded
$(window).on('load', () => {
    console.info("Window loaded");

    // this binds events only if font gets loaded
    WebFont.load(WebFontConfig);
})



// Event for on button
function calcOn() {
    resetCalc();

    if (!flagOn) {
        flagOn = true;
        bindEvents();
    }

    else if (replayTimeOut != undefined) {
        clearTimeout(replayTimeOut);
        replayTimeOut = undefined;
        bindEvents();
    }
}



// reseting calculator
function resetCalc() {
    if (operationSeq.length)
        console.info("Reseting calculator");

    countInps = 0;
    tempInp = "0";
    displayValue(tempInp);
    operationSeq = [];
    op_sign.html("");
    flagFirstRunOperations = true;
}



// function to display input on screen
function displayValue(val) {
    if (!val.includes('.')){
        val += ".";
    }
    display.text(val);
    setNoOfInp();
}




// binding event to the buttons when calculator is turned on
function bindEvents() {
    console.groupCollapsed("Binding events to the buttons");

    console.info("Binding events for midSec buttons");
    $('#midSec > div:last-child').on('click', correct);

    console.info("Binding events for sec1 buttons");
    $('#sec1 [data-op]').on('click', sec1Events);

    console.info("Binding events for sec2 buttons");
    $('#sec2 .secCom').on('click', sec2Events)

    console.info("Binding events for sec3 buttons");
    $('#sec3 [data-op]').on('click', sec3Events);
    $('#sec3 > div:nth-child(2) > .secCom:first-child').on('click', () => {
        replay();
    });

    console.info("Enabling keyboard input");
    $(window).on("keyup", KeyboardEvents);

    console.groupEnd();
}




// event for secMid correct button
function correct() {
    let oprSeqLen = operationSeq.length;

    if (oprSeqLen) {
        let lastEl = operationSeq[oprSeqLen - 1];
        let type = Object.keys(lastEl)[0];

        if (type != "opData") {

            let value = Object.values(lastEl)[0];
            value = (value.length > 1) ? value.substr(0, value.length - 1) : "0";

            if (type === "inpData")
                lastEl.inpData = value;
            else {
                resetCalc();
                countInps = 1;
                operationSeq.push({ inpData: value });
            }
            tempInp = value;
            displayValue(tempInp);
        }
    }
}




// event for buttons in section 1, i.e. additional operations
function sec1Events() {
    let oprSeqLen = operationSeq.length;
    if (oprSeqLen) {
        let lastEl = operationSeq[oprSeqLen - 1];
        let opr = $(this).data('op').trim();
        let type = Object.keys(lastEl)[0];

        if (type != "opData") {
            tempInp = Object.values(lastEl)[0];
            let errorState = false;

            switch (opr) {
                case 'signRev': tempInp *= -1;
                    break;
                case 'sqrt': {
                    tempInp = Math.sqrt(tempInp);
                    if (isNaN(tempInp)) {
                        alert("Square root can not be taken for negative numbers!");
                        errorState = true;
                    }
                }
            }

            if (!errorState) {
                tempInp = tempInp.toString();
                tempInp = formatData(tempInp);
                displayValue(tempInp);

                if (type === 'finalResult') {
                    let val = formatData(tempInp);
                    resetCalc();
                    tempInp = val;
                    operationSeq.push({ inpData: val });
                    countInps = 1;
                    displayValue(val);
                }
                else
                    operationSeq[oprSeqLen - 1].inpData = tempInp;
            }
        }
    }
}



// event for buttons in section 2, i.e. number pad
function sec2Events() {

    let newVal = $(this).text().trim();
    let oprSeqLen = operationSeq.length;
    let lastElOperationSeq = operationSeq[oprSeqLen - 1];

    if (lastElOperationSeq != undefined && lastElOperationSeq.hasOwnProperty('finalResult'))
        calcOn();

    oprSeqLen = operationSeq.length;
    op_sign.html('');

    if (!isNaN(newVal) && !Number(tempInp) && !tempInp.includes('.'))
        tempInp = Number(newVal).toString();
    else if((newVal != ".") || (newVal == "." && !tempInp.includes(newVal)))
        tempInp += newVal;

    if (oprSeqLen) {
        let temp = (operationSeq[oprSeqLen - 1]);
        if (temp.hasOwnProperty('inpData')) {
            countInps--;
            operationSeq.pop();
        }
        else if (temp.hasOwnProperty('resultData'))
            countInps--;
    }

    countInps++;

    tempInp = formatData(tempInp);
    displayValue(tempInp);
    operationSeq.push({ inpData: tempInp });
}



// event for buttons in section 3, i.e. basic operations
function sec3Events() {
    let opr = $(this).data('op').trim();
    let oprSeqLen = operationSeq.length;
    let oprSign;
    let lastElOperationSeq = operationSeq[oprSeqLen - 1];
    let lastFinalResult;

    if (!oprSeqLen)
        operationSeq.push({ inpData: tempInp });

    if (flagFirstRunOperations)
        flagFirstRunOperations = false;

    else if (oprSeqLen > 2 && lastElOperationSeq.hasOwnProperty('inpData'))
        evaluate();

    tempInp = "0";

    if (oprSeqLen) {
        if (lastElOperationSeq.hasOwnProperty('opData'))
            operationSeq.pop();

        else if (lastElOperationSeq.hasOwnProperty('finalResult'))
            lastFinalResult = operationSeq.splice((operationSeq.length - 2), 2);
    }

    switch (opr) {
        case 'add': oprSign = '+';
            break;

        case 'div': oprSign = '&divide';
            break;

        case 'mul': oprSign = '&times';
            break;

        case 'dif': oprSign = '-';
            break;

        case 'eql': oprSign = '=';
    }

    operationSeq.push({ opData: oprSign });
    op_sign.html(oprSign);

    if (oprSign === '=') {
        if (lastFinalResult)
            operationSeq.push(lastFinalResult[1]);
        else {
            setNoOfInp(++countInps);
            let finalRes = (operationSeq[oprSeqLen].hasOwnProperty('opData')) ? Object.values(operationSeq[oprSeqLen - 1])[0] : Object.values(operationSeq[oprSeqLen])[0];
            operationSeq.push({ finalResult: finalRes });
        }
    }
}



// to evaluate last operation
function evaluate() {
    let total = operationSeq.length;
    let first = operationSeq[total - 3].inpData || operationSeq[total - 3].resultData;
    let oprCode = operationSeq[total - 2].opData;
    let last = operationSeq[total - 1].inpData;
    let opr;
    let decimalPartLen;

    if(first.includes("."))
        decimalPartLen = first.length - first.indexOf(".") - 1;
    if(last.includes(".")){
        let temp = last.length - last.indexOf(".") - 1;
        if((!decimalPartLen) || (decimalPartLen && decimalPartLen < temp))
            decimalPartLen = temp;
    }

    switch (oprCode) {
        case '+': opr = '+';
            break;
        case '-': opr = '-';
            break;
        case '&times': opr = '*';
            break;
        case '&divide': opr = '/'
    }

    let result = eval(first + " " + opr + " " + last).toString();
    if(decimalPartLen)
        result = Number(result).toFixed(decimalPartLen);

    result = formatData(result);
    operationSeq.push({ resultData: result });
    displayValue(result);
}



// limiting digits
function formatData(val) {
    if (val.length > 12)
        val = val.includes('.') ? val.substr(0, 13) : val.substr(0, 12);
    return val;
}



// updating noofdigits
function setNoOfInp(val = countInps) {
    let count = val.toString();

    if (count.length == 1)
        count = "0" + count;

    noofdigits.text(count);
}


// for autoreplay
function replay(arr = [...operationSeq].filter(el => (!el.hasOwnProperty('resultData'))), firstRun = true, customCount = 1) {

    if (operationSeq.length > 2) {

        if (firstRun)
            unbindEvents();

        let temp = arr.shift();
        let key = Object.keys(temp)[0];
        let val = Object.values(temp)[0];

        if (val === '=')
            op_sign.html('');
        else if (key === 'opData')
            op_sign.html(val)
        else {
            displayValue(val);
            setNoOfInp(customCount++);
        }

        let nowFirst = arr[0];
        if (nowFirst) {
            if (nowFirst.hasOwnProperty('opData'))
                replay(arr, false, customCount);
            else {
                replayTimeOut = setTimeout(() => {
                    replay(arr, false, customCount);
                }, 1000);
            }
        }
        else {
            let lastVal = operationSeq[operationSeq.length - 1];
            if (lastVal.hasOwnProperty('finalResult'))
                op_sign.html('=');
            else if (lastVal.hasOwnProperty('inpData'))
                op_sign.html('');

            clearTimeout(replayTimeOut);
            replayTimeOut = undefined;
            console.info("Re-binding events")
            bindEvents();
        }
    }
}



// Keyboard events
function KeyboardEvents(event) {
    let key = event.key;
    if (!isNaN(key) || key === '.')
        $('#sec2 .secCom:contains(' + key + ')').first().click();
    else if (key === 'Backspace')
        correct();
    else {
        let dataOpVal;

        switch (key) {
            case '+': dataOpVal = 'add';
                break;
            case '-': dataOpVal = 'dif';
                break;
            case '*': dataOpVal = 'mul';
                break;
            case '/': dataOpVal = 'div';
                break;
            case 'Enter': dataOpVal = 'eql';
                break;
            case '=': dataOpVal = 'eql';
        }
        if (dataOpVal)
            $('#sec3 .secCom[data-op =' + dataOpVal + ']').click();
    }
}



// unbinding events
function unbindEvents() {
    console.info("Unbinding events")
    $('#midSec > div, #sec1 > div, .secCom:not(#on)').off('click');
    $(window).off("keyup");
}