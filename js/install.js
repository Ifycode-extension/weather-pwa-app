/*=================================================================
    Licence obtained at https://www.apache.org/licenses/LICENSE-2.0 
    in license file
==================================================================*/

'use strict';

let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', saveBeforeInstallPromptEvent);

const installButton = document.querySelector('#installButton');
function saveBeforeInstallPromptEvent(event) {
    //Add code to save event & show the install button.
    deferredInstallPrompt = event;
    installButton.removeAttribute('hidden');
}



installButton.addEventListener('click', installPWA);

function installPWA(event) {
    //Add code show install prompt & hide the install button.
    deferredInstallPrompt.prompt();

    // Hide the install button, it can't be called twice.
    event.srcElement.setAttribute('hidden', true);

    //Log user response to prompt.
    deferredInstallPrompt.userChoice
    .then(choice => {
        if (choice.outcome === 'accepted') {
            console.log('USer accepted the A2HS prompt', choice);
        }else {
            console.log('User dismissed the A2HS prompt', choice);
        }
        deferredInstallPrompt = null;
    });
}


window.addEventListener('appinstalled', logAppInstalled);

function logAppInstalled(event) {
    //Add code to log the event
    console.log('weather App was installed.', event);
}
