// References to field elements
var getInfoBtn = document.getElementById('getInfo');
var callInfoField = document.getElementById('callInfo');

// Plugin parameters
var apikey = getPluginParameter('apikey');
var apitoken = getPluginParameter('apitoken');
var accountSid = getPluginParameter('accountSid');
var sourceField = getPluginParameter('sourceField');

// Formats all error messages into consistent JSON structure
function formatErrorAsJSON(message, sid = null) {
    return {
        Call: {
            Sid: sid,
            Error: message
        }
    };
}

// Fetches call details using the call SID and formats any error as JSON
function fetchCallDetails(callSid, callback) {
    var url = "https://" + apikey + ":" + apitoken +
              "@api.exotel.in/v1/Accounts/" + accountSid + "/Calls/" + callSid + ".json?details=true";

    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.onreadystatechange = function () {
        if (request.readyState === 4) {
            try {
                if (request.status === 200) {
                    callback(null, JSON.parse(request.responseText));
                } else {
                    callback(formatErrorAsJSON("Error: " + request.status + " - " + request.statusText, callSid), null);
                }
            } catch (e) {
                callback(formatErrorAsJSON("Could not parse API response.", callSid), null);
            }
        }
    };
    request.send();
}

// Re-enables the button after an operation
function resetButton() {
    getInfoBtn.disabled = false;
    getInfoBtn.style.backgroundColor = '';
    getInfoBtn.style.cursor = '';
}

// Button click handler
getInfoBtn.onclick = function () {
    getInfoBtn.disabled = true;
    getInfoBtn.style.backgroundColor = '#d3d3d3';
    getInfoBtn.style.cursor = 'not-allowed';

    if (!sourceField || sourceField.trim() === "") {
        const errorJson = JSON.stringify([formatErrorAsJSON("No data found in source field.")], null, 4);
        callInfoField.value = errorJson;
        setAnswer(errorJson);
        resetButton();
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(sourceField);
    } catch (e) {
        const errorJson = JSON.stringify([formatErrorAsJSON("Invalid JSON format.")], null, 4);
        callInfoField.value = errorJson;
        setAnswer(errorJson);
        resetButton();
        return;
    }

    const results = [];
    const items = parsed.plugin_response || [];
    const callSids = items
        .filter(item => item.Call && item.Call.Sid)
        .map(item => item.Call.Sid);

    if (callSids.length === 0) {
        const errorJson = JSON.stringify([formatErrorAsJSON("No valid Call SIDs found.")], null, 4);
        callInfoField.value = errorJson;
        setAnswer(errorJson);
        resetButton();
        return;
    }

    let completed = 0;

    callSids.forEach(sid => {
        fetchCallDetails(sid, function (err, response) {
            results.push(err || response);
            completed++;
            if (completed === callSids.length) {
                const finalOutput = JSON.stringify(results, null, 4);
                callInfoField.value = finalOutput;
                setAnswer(finalOutput);
                resetButton();
            }
        });
    });
};
